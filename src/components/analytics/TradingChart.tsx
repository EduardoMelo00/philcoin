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

const TIME_RANGES: TimeRange[] = ["1D", "7D", "1M", "3M", "1Y", "ALL"];

const TIME_RANGE_DAYS: Record<TimeRange, number> = {
  "1D": 1,
  "7D": 7,
  "1M": 30,
  "3M": 90,
  "1Y": 365,
  ALL: 1825,
};

interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

function generateCandlestickData(days: number, basePrice: number): CandleData[] {
  const candles: CandleData[] = [];
  const now = Math.floor(Date.now() / 1000);
  const intervalSeconds = days <= 1 ? 300 : days <= 7 ? 3600 : 86400;
  const totalCandles = Math.floor((days * 86400) / intervalSeconds);
  let price = basePrice * (0.7 + Math.random() * 0.3);

  for (let i = 0; i < totalCandles; i++) {
    const volatility = 0.015 + Math.random() * 0.035;
    const trend = 0.0001;
    const change = (Math.random() - 0.48) * volatility + trend;

    const open = price;
    const close = Math.max(price * (1 + change), basePrice * 0.1);
    const wickUp = Math.random() * Math.abs(close - open) * 1.5;
    const wickDown = Math.random() * Math.abs(close - open) * 1.5;
    const high = Math.max(open, close) + wickUp;
    const low = Math.min(open, close) - wickDown;

    const time = now - (totalCandles - i) * intervalSeconds;
    const volume = 500_000 + Math.random() * 2_000_000;

    candles.push({
      time,
      open,
      high: Math.max(high, open, close),
      low: Math.max(Math.min(low, open, close), basePrice * 0.05),
      close,
      volume,
    });

    price = close;
  }

  return candles;
}

export default function TradingChart() {
  const [activeRange, setActiveRange] = useState<TimeRange>("7D");
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const [currentCandle, setCurrentCandle] = useState<CandleData | null>(null);

  const initChart = useCallback(() => {
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

    const days = TIME_RANGE_DAYS[activeRange];
    const candles = generateCandlestickData(days, 0.00234);

    candleSeries.setData(
      candles.map((c) => ({
        time: c.time as never,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }))
    );

    volumeSeries.setData(
      candles.map((c) => ({
        time: c.time as never,
        value: c.volume,
        color: c.close >= c.open ? "rgba(34, 197, 94, 0.2)" : "rgba(239, 68, 68, 0.2)",
      }))
    );

    chart.timeScale().fitContent();

    if (candles.length > 0) {
      setCurrentCandle(candles[candles.length - 1]);
    }

    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !param.seriesData) return;
      const candleData = param.seriesData.get(candleSeries);
      if (candleData && "open" in candleData) {
        setCurrentCandle({
          time: param.time as number,
          open: candleData.open,
          high: candleData.high,
          low: candleData.low,
          close: candleData.close,
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
    const cleanup = initChart();
    return () => cleanup?.();
  }, [initChart]);

  const bullish = currentCandle ? currentCandle.close >= currentCandle.open : true;

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
            <div className="w-1.5 h-1.5 rounded-full bg-accent-bullish animate-pulse" />
            <span className="text-[10px] text-text-tertiary font-medium uppercase tracking-wider">Live</span>
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

      <div
        ref={chartContainerRef}
        className="w-full h-[300px] md:h-[400px] lg:h-[520px]"
        aria-label="Candlestick trading chart for PHILCOIN"
      />
    </motion.div>
  );
}
