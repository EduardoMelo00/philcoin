"use client";

import { motion } from "framer-motion";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import type { GrowthMetric } from "@/types/analytics";

interface GrowthMetricsProps {
  metrics: GrowthMetric[];
}

function SparklineChart({ data, positive }: { data: number[]; positive: boolean }) {
  const chartData = data.map((value, index) => ({ index, value }));
  const color = positive ? "#22C55E" : "#EF4444";

  return (
    <div className="w-20 h-8">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            fill={color}
            fillOpacity={0.08}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function GrowthMetrics({ metrics }: GrowthMetricsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 1.0 }}
      className="analytics-card p-4 md:p-6"
    >
      <h2 className="text-xl font-semibold text-text-primary mb-4">Growth Metrics</h2>

      <div className="space-y-4">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 1.0 + index * 0.1 }}
            className="flex items-center justify-between py-3 border-b border-[var(--border-subtle)] last:border-0"
          >
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-text-tertiary uppercase tracking-wider font-medium">
                {metric.label}
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className={`text-xl font-mono font-semibold ${metric.positive ? "text-accent-bullish" : "text-accent-bearish"}`}>
                  {metric.value}
                </span>
                <span className="text-xs text-text-tertiary">{metric.trendLabel}</span>
              </div>
            </div>
            <SparklineChart data={metric.sparklineData} positive={metric.positive} />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
