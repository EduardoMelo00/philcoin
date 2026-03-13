"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { truncateAddress, formatLargeNumber } from "@/lib/formatters";
import { HOLDER_SEGMENT_COLORS } from "@/lib/constants";
import { getExchangeLogo, GenericDexLogo } from "./DexLogos";
import type { HolderData, HolderLabel } from "@/types/analytics";

interface HolderDistributionProps {
  data: HolderData;
}

const LABEL_STYLES: Record<HolderLabel, string> = {
  Treasury: "bg-blue-500/10 text-blue-400",
  Team: "bg-purple-500/10 text-purple-400",
  Exchange: "bg-amber-500/10 text-amber-400",
  LP: "bg-emerald-500/10 text-emerald-400",
  Community: "bg-slate-500/10 text-slate-400",
  Unknown: "bg-slate-500/10 text-slate-500",
};

function HHIIndicator({ hhi, level }: { hhi: number; level: string }) {
  const position = Math.min(hhi / 0.4, 1) * 100;
  const barColor = hhi <= 0.15 ? "#22C55E" : hhi <= 0.25 ? "#F59E0B" : "#EF4444";

  return (
    <div className="mt-4">
      <div className="flex justify-between text-[10px] text-text-tertiary mb-1">
        <span>Fragmented</span>
        <span>Concentrated</span>
      </div>
      <div className="relative h-2 rounded-full bg-elevated overflow-hidden">
        <div className="absolute inset-0 rounded-full" style={{
          background: "linear-gradient(90deg, #22C55E, #F59E0B 50%, #EF4444)"
        }} />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-surface shadow-lg transition-all duration-500"
          style={{ left: `${position}%`, backgroundColor: barColor }}
        />
      </div>
      <p className="text-xs text-text-secondary mt-2 text-center">
        HHI: <span className="font-mono font-semibold" style={{ color: barColor }}>{hhi.toFixed(3)}</span>
        {" "}<span className="text-text-tertiary">({level} Concentration)</span>
      </p>
    </div>
  );
}

export default function HolderDistribution({ data }: HolderDistributionProps) {
  const [showAll, setShowAll] = useState(false);
  const top10 = data.holders.slice(0, 10);
  const top10Percentage = top10.reduce((sum, h) => sum + h.percentage, 0);
  const othersPercentage = 100 - top10Percentage;
  const visibleHolders = showAll ? data.holders : data.holders.slice(0, 10);

  const chartData = [
    ...top10.map((h, i) => ({
      name: truncateAddress(h.address),
      value: h.percentage,
      fill: HOLDER_SEGMENT_COLORS[i],
      label: h.label,
      exchangeName: h.exchangeName,
      displayName: h.exchangeName || h.label,
    })),
    { name: "Others", value: othersPercentage, fill: "#475569", label: "Community" as HolderLabel, exchangeName: undefined, displayName: "Others" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.3 }}
      className="analytics-card p-4 md:p-6"
    >
      <h2 className="text-xl font-semibold text-text-primary mb-4">Holder Distribution</h2>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-[30%] flex flex-col items-center">
          <div className="w-[220px] h-[220px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={68}
                  outerRadius={105}
                  paddingAngle={1}
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={600}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip
                  wrapperStyle={{ zIndex: 50 }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.[0]) return null;
                    const entry = payload[0].payload;
                    const exchangeName = entry?.exchangeName;
                    const Logo = exchangeName ? getExchangeLogo(exchangeName) : null;
                    const displayName = entry?.displayName || payload[0].name;
                    const holderLabel = entry?.label as HolderLabel;
                    return (
                      <div className="bg-overlay border border-[var(--border-subtle)] rounded-lg px-3 py-2.5 shadow-xl z-50 min-w-[140px]">
                        <div className="flex items-center gap-2 mb-1">
                          {Logo && <Logo size={18} />}
                          <span className="text-xs font-semibold text-text-primary">{displayName}</span>
                        </div>
                        {exchangeName && (
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${LABEL_STYLES[holderLabel]}`}>
                            {holderLabel}
                          </span>
                        )}
                        <p className="text-xs text-text-tertiary mt-1">{payload[0].name}</p>
                        <p className="text-lg font-mono font-bold text-text-primary mt-0.5">
                          {(payload[0].value as number).toFixed(2)}%
                        </p>
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] text-text-tertiary uppercase tracking-wider">Top 10</span>
              <span className="text-2xl font-bold font-mono text-text-primary">{top10Percentage.toFixed(1)}%</span>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-x-3 gap-y-1.5 mt-4">
            {(() => {
              const labelCounts: Record<string, { count: number; percentage: number; color: string }> = {};
              top10.forEach((h, i) => {
                const key = h.exchangeName || h.label;
                if (!labelCounts[key]) {
                  labelCounts[key] = { count: 0, percentage: 0, color: HOLDER_SEGMENT_COLORS[i] || "#475569" };
                }
                labelCounts[key].count += 1;
                labelCounts[key].percentage += h.percentage;
              });
              labelCounts["Others"] = { count: 0, percentage: othersPercentage, color: "#475569" };
              return Object.entries(labelCounts).map(([label, { percentage, color }]) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-[10px] text-text-secondary whitespace-nowrap">
                    {label} <span className="font-mono text-text-tertiary">{percentage.toFixed(1)}%</span>
                  </span>
                </div>
              ));
            })()}
          </div>

          <HHIIndicator hhi={data.hhi} level={data.concentrationLevel} />

          <p className="text-xs text-text-tertiary mt-3">
            {formatLargeNumber(data.totalHolders)} total holders
          </p>
        </div>

        <div className="lg:w-[70%] overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="text-[10px] text-text-tertiary uppercase tracking-wider">
                <th className="text-left py-2 px-2 font-medium w-8">#</th>
                <th className="text-left py-2 px-2 font-medium">Address</th>
                <th className="text-right py-2 px-2 font-medium hidden sm:table-cell">Holdings</th>
                <th className="text-right py-2 px-2 font-medium w-16">%</th>
                <th className="text-left py-2 px-2 font-medium w-36">Label</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {visibleHolders.map((holder, index) => (
                  <motion.tr
                    key={holder.address}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`transition-colors duration-150 hover:bg-elevated ${index % 2 === 1 ? "bg-white/[0.01]" : ""}`}
                  >
                    <td className="py-2 px-2 text-xs text-text-tertiary font-mono">{holder.rank}</td>
                    <td className="py-2 px-2">
                      <a
                        href={`https://polygonscan.com/token/0x24c80D7F032Bc8D308F10d59e20d5a65b90b7334?a=${holder.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-mono text-text-secondary hover:text-accent-primary transition-colors"
                      >
                        {truncateAddress(holder.address)}
                      </a>
                    </td>
                    <td className="py-2 px-2 text-xs font-mono text-text-secondary text-right hidden sm:table-cell">
                      {formatLargeNumber(holder.holdings)}
                    </td>
                    <td className="py-2 px-2 text-xs font-mono text-text-primary text-right font-medium">
                      {holder.percentage.toFixed(2)}%
                    </td>
                    <td className="py-2 px-2">
                      <div className="flex items-center gap-1.5 min-w-[120px]">
                        {holder.exchangeName && (() => {
                          const Logo = getExchangeLogo(holder.exchangeName);
                          return Logo ? <Logo size={16} /> : <GenericDexLogo size={16} />;
                        })()}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${LABEL_STYLES[holder.label]}`}>
                          {holder.exchangeName || holder.label}
                        </span>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>

          {data.holders.length > 10 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="mt-3 w-full py-2 text-xs font-medium text-accent-primary hover:text-text-primary bg-elevated/50 hover:bg-elevated rounded-lg transition-all duration-200"
            >
              {showAll ? "Show Top 10" : `View All ${data.holders.length} Holders`}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
