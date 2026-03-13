"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createChart, type IChartApi, type ISeriesApi, ColorType, LineStyle, AreaSeries, HistogramSeries } from "lightweight-charts";
import { motion } from "framer-motion";
import { usePriceHistory } from "@/hooks/useTokenPrice";
import { formatPrice } from "@/lib/formatters";
import { SkeletonBar } from "./Skeleton";
import type { TimeRange } from "@/types/analytics";

const TIME_RANGES: TimeRange[] = ["1D", "7D", "1M", "3M", "1Y", "ALL"];

export default function PriceChart() {
  const [activeRange, setActiveRange] = useState<TimeRange>("1M");
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const areaSeriesRef = useRef<ISeriesApi<"Area"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);

  const { data: priceHistory, isLoading } = usePriceHistory(activeRange);

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
        vertLines: { visible: false },
        horzLines: { color: "rgba(148, 163, 184, 0.05)", style: LineStyle.Solid },
      },
      crosshair: {
        vertLine: { color: "rgba(148, 163, 184, 0.2)", style: LineStyle.Dashed, width: 1, labelVisible: false },
        horzLine: { color: "rgba(148, 163, 184, 0.2)", style: LineStyle.Dashed, width: 1, labelVisible: true },
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.1, bottom: 0.25 },
      },
      timeScale: {
        borderVisible: false,
        timeVisible: activeRange === "1D",
        secondsVisible: false,
      },
      handleScale: { mouseWheel: true, pinch: true },
      handleScroll: { mouseWheel: false, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: false },
    });

    const areaSeries = chart.addSeries(AreaSeries, {
      lineColor: "#3B82F6",
      topColor: "rgba(59, 130, 246, 0.15)",
      bottomColor: "rgba(59, 130, 246, 0.01)",
      lineWidth: 2,
      crosshairMarkerRadius: 4,
      crosshairMarkerBorderColor: "#3B82F6",
      crosshairMarkerBackgroundColor: "#0B0E18",
      priceFormat: { type: "price", precision: 6, minMove: 0.000001 },
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: "rgba(59, 130, 246, 0.15)",
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
    });

    chart.priceScale("volume").applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    chartRef.current = chart;
    areaSeriesRef.current = areaSeries;
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

  useEffect(() => {
    if (!priceHistory || !areaSeriesRef.current || !volumeSeriesRef.current) return;

    const areaData = priceHistory.map((p) => ({
      time: p.time as number,
      value: p.value,
    }));

    const volumeData = priceHistory
      .filter((p) => p.volume !== undefined)
      .map((p) => ({
        time: p.time as number,
        value: p.volume!,
        color: "rgba(59, 130, 246, 0.12)",
      }));

    areaSeriesRef.current.setData(areaData as never[]);
    volumeSeriesRef.current.setData(volumeData as never[]);

    if (priceHistory.length >= 2) {
      const firstPrice = priceHistory[0].value;
      const lastPrice = priceHistory[priceHistory.length - 1].value;
      const bullish = lastPrice >= firstPrice;

      areaSeriesRef.current.applyOptions({
        lineColor: bullish ? "#22C55E" : "#EF4444",
        topColor: bullish ? "rgba(34, 197, 94, 0.15)" : "rgba(239, 68, 68, 0.15)",
        bottomColor: bullish ? "rgba(34, 197, 94, 0.01)" : "rgba(239, 68, 68, 0.01)",
      });
    }

    chartRef.current?.timeScale().fitContent();
  }, [priceHistory]);

  const currentPrice = priceHistory?.[priceHistory.length - 1]?.value;
  const startPrice = priceHistory?.[0]?.value;
  const priceChange = currentPrice && startPrice
    ? ((currentPrice - startPrice) / startPrice) * 100
    : 0;
  const bullish = priceChange >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.4 }}
      className="analytics-card p-4 md:p-6"
      style={{ borderRadius: "16px" }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl font-semibold text-text-primary">Price</h2>
          {currentPrice && (
            <p className="text-sm text-text-secondary mt-0.5">
              <span className="font-mono">${formatPrice(currentPrice)}</span>
              <span className={`ml-2 font-mono ${bullish ? "text-accent-bullish" : "text-accent-bearish"}`}>
                {bullish ? "+" : ""}{priceChange.toFixed(2)}%
              </span>
            </p>
          )}
        </div>
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

      {isLoading && !priceHistory ? (
        <SkeletonBar width="100%" height="360px" />
      ) : (
        <div
          ref={chartContainerRef}
          className="w-full h-[280px] md:h-[360px] lg:h-[480px]"
          aria-label={
            currentPrice
              ? `Price chart showing PHILCOIN at $${formatPrice(currentPrice)}, ${bullish ? "up" : "down"} ${Math.abs(priceChange).toFixed(2)}%`
              : "Price chart loading"
          }
        />
      )}
    </motion.div>
  );
}
