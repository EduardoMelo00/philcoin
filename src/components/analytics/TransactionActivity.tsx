"use client";

import { motion } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine,
} from "recharts";
import { formatCompactNumber } from "@/lib/formatters";
import type { TransactionData } from "@/types/analytics";

interface TransactionActivityProps {
  data: TransactionData;
}

function renderSimpleTooltip(formatter: (v: number) => string) {
  return function TooltipContent({ active, payload, label }: Record<string, unknown>) {
    if (!active) return null;
    const items = payload as Array<{ value: number }> | undefined;
    if (!items?.[0]) return null;
    return (
      <div className="bg-overlay border border-[var(--border-subtle)] rounded-lg px-3 py-2 shadow-xl">
        <p className="text-[10px] text-text-tertiary">{String(label)}</p>
        <p className="text-xs font-mono font-semibold text-text-primary">
          {formatter(items[0].value)}
        </p>
      </div>
    );
  };
}

function BuySellTooltip({ active, payload, label }: Record<string, unknown>) {
  if (!active) return null;
  const items = payload as Array<{ value: number; dataKey: string }> | undefined;
  if (!items?.[0]) return null;
  const buy = items.find((p) => p.dataKey === "buy");
  const sell = items.find((p) => p.dataKey === "sell");
  return (
    <div className="bg-overlay border border-[var(--border-subtle)] rounded-lg px-3 py-2 shadow-xl">
      <p className="text-[10px] text-text-tertiary">{String(label)}</p>
      {buy && <p className="text-xs font-mono text-accent-bullish">Buy: ${formatCompactNumber(buy.value)}</p>}
      {sell && <p className="text-xs font-mono text-accent-bearish">Sell: ${formatCompactNumber(Math.abs(sell.value))}</p>}
    </div>
  );
}

const TxnTooltip = renderSimpleTooltip((v) => `${formatCompactNumber(v)} txns`);
const WalletTooltip = renderSimpleTooltip((v) => `${formatCompactNumber(v)} wallets`);

export default function TransactionActivity({ data }: TransactionActivityProps) {
  const buySellData = data.daily.map((d) => ({
    date: d.date.slice(5),
    buy: d.buyVolume,
    sell: -d.sellVolume,
  }));

  const buyPressureColor = data.buyPressure >= 55
    ? "text-accent-bullish glow-bullish"
    : data.buyPressure <= 45
    ? "text-accent-bearish glow-bearish"
    : "text-text-primary";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.8 }}
      className="analytics-card p-4 md:p-6"
    >
      <h2 className="text-xl font-semibold text-text-primary mb-4">Transaction Activity</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <h3 className="text-[10px] text-text-tertiary uppercase tracking-wider font-medium mb-2">
            Daily Transactions
          </h3>
          <div className="h-[140px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.daily.map((d) => ({ date: d.date.slice(5), value: d.count }))}>
                <XAxis dataKey="date" hide />
                <YAxis hide />
                <Tooltip content={TxnTooltip as never} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#6366F1"
                  fill="rgba(99, 102, 241, 0.1)"
                  strokeWidth={1.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <h3 className="text-[10px] text-text-tertiary uppercase tracking-wider font-medium mb-2">
            Active Wallets
          </h3>
          <div className="h-[140px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.daily.map((d) => ({ date: d.date.slice(5), value: d.activeWallets }))}>
                <XAxis dataKey="date" hide />
                <YAxis hide />
                <Tooltip content={WalletTooltip as never} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#3B82F6"
                  strokeWidth={1.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <h3 className="text-[10px] text-text-tertiary uppercase tracking-wider font-medium mb-2">
            Buy / Sell Pressure
          </h3>
          <div className="h-[140px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={buySellData}>
                <XAxis dataKey="date" hide />
                <YAxis hide />
                <ReferenceLine y={0} stroke="rgba(148, 163, 184, 0.1)" />
                <Tooltip content={BuySellTooltip as never} />
                <Bar dataKey="buy" fill="#22C55E" radius={[2, 2, 0, 0]} />
                <Bar dataKey="sell" fill="#EF4444" radius={[0, 0, 2, 2]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[var(--border-subtle)]">
        <div className="text-center">
          <span className="text-lg font-mono font-semibold text-text-primary">
            {formatCompactNumber(data.todayTxns)}
          </span>
          <p className="text-[10px] text-text-tertiary">Txns Today</p>
        </div>
        <div className="text-center">
          <span className="text-lg font-mono font-semibold text-text-primary">
            {formatCompactNumber(data.todayWallets)}
          </span>
          <p className="text-[10px] text-text-tertiary">Active Wallets</p>
        </div>
        <div className="text-center">
          <span className={`text-lg font-mono font-semibold ${buyPressureColor}`}>
            {data.buyPressure}%
          </span>
          <p className="text-[10px] text-text-tertiary">Buy Pressure</p>
        </div>
      </div>
    </motion.div>
  );
}
