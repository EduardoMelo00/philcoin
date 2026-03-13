"use client";

import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/formatters";
import type { LiquidityData } from "@/types/analytics";

interface LiquidityAnalysisProps {
  data: LiquidityData;
}

function generateDepthData() {
  const bids = [];
  const asks = [];
  const midPrice = 0.00234;

  let cumulativeBid = 0;
  let cumulativeAsk = 0;

  for (let i = 20; i >= 1; i--) {
    const price = midPrice * (1 - i * 0.005);
    cumulativeBid += 50000 + Math.random() * 100000;
    bids.push({ price: price.toFixed(6), bid: cumulativeBid, ask: 0 });
  }

  for (let i = 1; i <= 20; i++) {
    const price = midPrice * (1 + i * 0.005);
    cumulativeAsk += 50000 + Math.random() * 100000;
    asks.push({ price: price.toFixed(6), bid: 0, ask: cumulativeAsk });
  }

  return [...bids, { price: midPrice.toFixed(6), bid: cumulativeBid, ask: 0 }, ...asks];
}

export default function LiquidityAnalysis({ data }: LiquidityAnalysisProps) {
  const maxTvl = Math.max(...data.pools.map((p) => p.tvl));
  const depthData = generateDepthData();

  const healthColor = {
    Healthy: "text-accent-bullish",
    Adequate: "text-accent-warning",
    Low: "text-accent-bearish",
  }[data.liquidityHealth];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.6 }}
      className="analytics-card p-4 md:p-6"
    >
      <h2 className="text-xl font-semibold text-text-primary mb-4">Liquidity Analysis</h2>

      <div className="space-y-3 mb-6">
        {data.pools.map((pool) => (
          <div key={pool.name} className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary">{pool.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono font-medium text-text-primary">
                  {formatCurrency(pool.tvl)}
                </span>
                <span className={`text-[10px] font-mono ${pool.change24h >= 0 ? "text-accent-bullish" : "text-accent-bearish"}`}>
                  {pool.change24h >= 0 ? "+" : ""}{pool.change24h.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="h-2.5 rounded-full bg-elevated overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(pool.tvl / maxTvl) * 100}%` }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="h-full rounded-full"
                style={{
                  background: "linear-gradient(90deg, #3B82F6, #6366F1)",
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mb-6">
        <h3 className="text-xs text-text-tertiary uppercase tracking-wider font-medium mb-3">Order Book Depth</h3>
        <div className="h-[160px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={depthData}>
              <XAxis dataKey="price" hide />
              <YAxis hide />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.[0]) return null;
                  const point = payload[0].payload;
                  return (
                    <div className="bg-overlay border border-[var(--border-subtle)] rounded-lg px-3 py-2 shadow-xl">
                      <p className="text-[10px] text-text-tertiary">Price: ${point.price}</p>
                      {point.bid > 0 && (
                        <p className="text-xs font-mono text-accent-bullish">
                          Bid: {formatCurrency(point.bid)}
                        </p>
                      )}
                      {point.ask > 0 && (
                        <p className="text-xs font-mono text-accent-bearish">
                          Ask: {formatCurrency(point.ask)}
                        </p>
                      )}
                    </div>
                  );
                }}
              />
              <Area
                type="stepAfter"
                dataKey="bid"
                stroke="#22C55E"
                fill="rgba(34, 197, 94, 0.1)"
                strokeWidth={1.5}
              />
              <Area
                type="stepAfter"
                dataKey="ask"
                stroke="#EF4444"
                fill="rgba(239, 68, 68, 0.1)"
                strokeWidth={1.5}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[var(--border-subtle)]">
        <div>
          <p className="text-[10px] text-text-tertiary uppercase tracking-wider">Total Liquidity</p>
          <p className="text-lg font-mono font-semibold text-text-primary mt-1">
            {formatCurrency(data.totalLiquidity)}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-text-tertiary uppercase tracking-wider">Liq/MCap</p>
          <p className={`text-lg font-mono font-semibold mt-1 ${healthColor}`}>
            {data.liquidityMcapRatio.toFixed(1)}%
          </p>
          <p className={`text-[10px] ${healthColor}`}>{data.liquidityHealth}</p>
        </div>
        <div>
          <p className="text-[10px] text-text-tertiary uppercase tracking-wider">24h Net Flow</p>
          <p className={`text-lg font-mono font-semibold mt-1 ${data.netFlow24h >= 0 ? "text-accent-bullish" : "text-accent-bearish"}`}>
            {data.netFlow24h >= 0 ? "+" : ""}{formatCurrency(data.netFlow24h)}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
