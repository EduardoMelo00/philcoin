"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  createChart,
  type IChartApi,
  type ISeriesApi,
  ColorType,
  LineStyle,
  CandlestickSeries,
  HistogramSeries,
} from "lightweight-charts";
import { motion } from "framer-motion";
import type { TimeRange } from "@/types/analytics";
import { usePriceCandles, type PriceCandle } from "@/hooks/usePriceCandles";

const TIME_RANGES: TimeRange[] = ["1D", "7D", "1M", "3M", "1Y", "ALL"];

export default function TradingChart() {
  const [activeRange, setActiveRange] = useState<TimeRange>("7D");
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const [currentCandle, setCurrentCandle] = useState<PriceCandle | null>(null);

  const { data, isLoading, isError } = usePriceCandles(activeRange);
  const candles = data?.candles ?? [];
  const isStale = data?.stale === true;

  const renderChart = useCallback((candleData: PriceCandle[]) => {
    if (!chartContainerRef.current) return;

    try {
      chartRef.current?.remove();
    } catch {
      // chart already disposed
    }
    chartRef.current = null;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#64748B",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
      },
      grid: {
        vertLines: { color: "rgba(148, 163, 184, 0.04)", style: LineStyle.Solid },
        horzLines: { color: "rgba(148, 163, 184, 0.04)", style: LineStyle.Solid },
      },
      crosshair: {
        mode: 0,
        vertLine: {
          color: "rgba(148, 163, 184, 0.3)",
          style: LineStyle.Dashed,
          width: 1,
          labelVisible: true,
          labelBackgroundColor: "#111527",
        },
        horzLine: {
          color: "rgba(148, 163, 184, 0.3)",
          style: LineStyle.Dashed,
          width: 1,
          labelVisible: true,
          labelBackgroundColor: "#111527",
        },
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.05, bottom: 0.25 },
      },
      timeScale: {
        borderVisible: false,
        timeVisible: activeRange === "1D" || activeRange === "7D",
        secondsVisible: false,
        borderColor: "rgba(148, 163, 184, 0.06)",
      },
      handleScale: { mouseWheel: true, pinch: true },
      handleScroll: { mouseWheel: false, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: false },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#22C55E",
      downColor: "#EF4444",
      borderUpColor: "#22C55E",
      borderDownColor: "#EF4444",
      wickUpColor: "#22C55E",
      wickDownColor: "#EF4444",
      priceFormat: { type: "price", precision: 6, minMove: 0.000001 },
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
    });

    chart.priceScale("volume").applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    candleSeries.setData(
      candleData.map((c) => ({
        time: c.time as never,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      })),
    );

    volumeSeries.setData(
      candleData.map((c) => ({
        time: c.time as never,
        value: c.volume,
        color: c.close >= c.open ? "rgba(34, 197, 94, 0.2)" : "rgba(239, 68, 68, 0.2)",
      })),
    );

    chart.timeScale().fitContent();

    if (candleData.length > 0) {
      setCurrentCandle(candleData[candleData.length - 1]);
    }

    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !param.seriesData) return;
      const hovered = param.seriesData.get(candleSeries);
      if (hovered && "open" in hovered) {
        setCurrentCandle({
          time: param.time as number,
          open: hovered.open,
          high: hovered.high,
          low: hovered.low,
          close: hovered.close,
          volume: 0,
        });
      }
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    const resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      chart.applyOptions({ width, height });
    });
    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      try {
        chart.remove();
      } catch {
        // chart already disposed
      }
    };
  }, [activeRange]);

  useEffect(() => {
    if (candles.length === 0) return;
    const cleanup = renderChart(candles);
    return () => cleanup?.();
  }, [renderChart, candles]);

  const bullish = currentCandle ? currentCandle.close >= currentCandle.open : true;
  const showEmptyState = !isLoading && candles.length === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.5 }}
      className="analytics-card p-4 md:p-6"
      style={{ borderRadius: "16px" }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-text-primary">Trading View</h2>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-elevated">
            <div className={`w-1.5 h-1.5 rounded-full ${isStale ? "bg-amber-400" : "bg-accent-bullish animate-pulse"}`} />
            <span className="text-[10px] text-text-tertiary font-medium uppercase tracking-wider">
              {isStale ? "Cached" : "Live"}
            </span>
          </div>
        </div>

        {currentCandle && (
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="text-text-tertiary">
              O <span className="text-text-secondary">{currentCandle.open.toFixed(6)}</span>
            </span>
            <span className="text-text-tertiary">
              H <span className="text-accent-bullish">{currentCandle.high.toFixed(6)}</span>
            </span>
            <span className="text-text-tertiary">
              L <span className="text-accent-bearish">{currentCandle.low.toFixed(6)}</span>
            </span>
            <span className="text-text-tertiary">
              C <span className={bullish ? "text-accent-bullish" : "text-accent-bearish"}>{currentCandle.close.toFixed(6)}</span>
            </span>
          </div>
        )}

        <div className="flex gap-1 overflow-x-auto hide-scrollbar">
          {TIME_RANGES.map((range) => (
            <button
              key={range}
              onClick={() => setActiveRange(range)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-150 whitespace-nowrap ${
                activeRange === range
                  ? "bg-accent-primary text-text-primary"
                  : "text-text-tertiary hover:bg-elevated hover:text-text-secondary"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <div
          ref={chartContainerRef}
          className="w-full h-[300px] md:h-[400px] lg:h-[520px]"
          aria-label="Candlestick trading chart for PHILCOIN"
        />

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-text-tertiary">
            Loading price history from CoinGecko…
          </div>
        )}

        {showEmptyState && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-text-tertiary">
            {isError ? "Price history unavailable right now." : "No price data for this range."}
          </div>
        )}
      </div>
    </motion.div>
  );
}
