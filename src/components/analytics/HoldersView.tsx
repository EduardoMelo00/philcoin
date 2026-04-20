"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import PhilLogo from "./PhilLogo";
import { useTokenPrice } from "@/hooks/useTokenPrice";
import { formatCompactNumber, formatCurrency, truncateAddress } from "@/lib/formatters";

type HolderLabel = "Treasury" | "Team" | "Exchange" | "LP" | "Community" | "Unknown";

interface Holder {
  rank: number;
  address: string;
  holdings: number;
  percentage: number;
  label: HolderLabel;
  entityName?: string;
  isContract: boolean;
}

interface HoldersResponse {
  total: number;
  generatedAt: string;
  lastBlock?: number;
  source?: string;
  holders: Holder[];
}

const PAGE_SIZE = 50;

const LABEL_COLORS: Record<HolderLabel, string> = {
  Treasury: "text-amber-400 border-amber-400/30 bg-amber-400/5",
  Team: "text-violet-400 border-violet-400/30 bg-violet-400/5",
  Exchange: "text-cyan-400 border-cyan-400/30 bg-cyan-400/5",
  LP: "text-emerald-400 border-emerald-400/30 bg-emerald-400/5",
  Community: "text-pink-400 border-pink-400/30 bg-pink-400/5",
  Unknown: "text-slate-400 border-slate-500/30 bg-slate-500/5",
};

export default function HoldersView() {
  const [data, setData] = useState<HoldersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [labelFilter, setLabelFilter] = useState<HolderLabel | "All">("All");
  const [page, setPage] = useState(1);
  const { data: priceData } = useTokenPrice();
  const phlPrice = priceData?.usd ?? 0;

  useEffect(() => {
    let mounted = true;
    fetch("/holders.json", { cache: "no-cache" })
      .then((r) => {
        if (!r.ok) throw new Error(`Snapshot not found (HTTP ${r.status}). Indexer may not have run yet.`);
        return r.json();
      })
      .then((d: HoldersResponse) => { if (mounted) setData(d); })
      .catch((e) => mounted && setError(e instanceof Error ? e.message : String(e)))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    return data.holders.filter((h) => {
      if (labelFilter !== "All" && h.label !== labelFilter) return false;
      if (!q) return true;
      return (
        h.address.includes(q) ||
        (h.entityName ?? "").toLowerCase().includes(q) ||
        h.label.toLowerCase().includes(q)
      );
    });
  }, [data, query, labelFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const stats = useMemo(() => {
    if (!data) return null;
    const totalHoldings = data.holders.reduce((s, h) => s + h.holdings, 0);
    const totalUsd = totalHoldings * phlPrice;
    const top10 = data.holders.slice(0, 10).reduce((s, h) => s + h.percentage, 0);
    const exchanges = data.holders.filter((h) => h.label === "Exchange").reduce((s, h) => s + h.holdings, 0);
    return { totalUsd, top10Pct: top10, exchangeSupply: exchanges };
  }, [data, phlPrice]);

  return (
    <main className="min-h-screen pb-20" style={{ backgroundColor: "var(--bg-void)" }}>
      <header className="sticky top-0 z-40 border-b backdrop-blur-xl" style={{
        backgroundColor: "var(--bg-glass)",
        borderColor: "var(--border-subtle)",
      }}>
        <div className="max-w-[1440px] mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <PhilLogo size={28} />
            <div className="hidden md:block">
              <div className="text-text-primary font-semibold text-sm">PHILCOIN Analytics</div>
              <div className="text-xs text-text-tertiary group-hover:text-text-primary transition">← Dashboard</div>
            </div>
          </Link>
          <nav className="flex gap-1 text-sm">
            <Link href="/" className="px-3 py-1.5 rounded-md text-text-tertiary hover:text-text-primary hover:bg-white/5 transition">Overview</Link>
            <Link href="/holders" className="px-3 py-1.5 rounded-md text-text-primary bg-accent-phil/10 border border-accent-phil/30">Holders</Link>
            <Link href="/contracts" className="px-3 py-1.5 rounded-md text-text-tertiary hover:text-text-primary hover:bg-white/5 transition">Contracts</Link>
          </nav>
        </div>
      </header>

      <section className="max-w-[1440px] mx-auto px-4 md:px-6 pt-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-text-primary tracking-tight">
              PHL Holders Registry
            </h1>
            <p className="text-text-secondary mt-1">
              Complete on-chain list of wallets holding PHILCOIN on Polygon.
              {data && <> Snapshot {new Date(data.generatedAt).toLocaleString()}{data.lastBlock ? ` · block ${data.lastBlock.toLocaleString()}` : ""}.</>}
            </p>
          </div>

          <a
            href="/holders.csv"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-accent-phil/40 bg-accent-phil/10 text-accent-phil hover:bg-accent-phil/20 hover:border-accent-phil transition font-medium text-sm"
            download
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export CSV
          </a>
        </div>

        {data && stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            <StatBox label="Total Holders" value={data.total.toLocaleString()} accent="text-text-primary" />
            <StatBox label="Total USD Value" value={formatCurrency(stats.totalUsd)} accent="text-accent-phil" />
            <StatBox label="Top 10 Share" value={`${stats.top10Pct.toFixed(2)}%`} accent="text-violet-400" />
            <StatBox label="On Exchanges" value={`${formatCompactNumber(stats.exchangeSupply)} PHL`} accent="text-cyan-400" />
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            placeholder="Search address, entity, or label…"
            className="flex-1 px-4 py-2.5 rounded-lg bg-surface border border-white/10 text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-accent-phil/50 font-mono"
          />
          <div className="flex gap-1 overflow-x-auto hide-scrollbar">
            {(["All", "Treasury", "Team", "Exchange", "LP", "Community", "Unknown"] as const).map((l) => (
              <button
                key={l}
                onClick={() => { setLabelFilter(l); setPage(1); }}
                className={`px-3 py-1.5 rounded-md text-xs font-medium border whitespace-nowrap transition ${
                  labelFilter === l
                    ? "border-accent-phil/50 bg-accent-phil/10 text-accent-phil"
                    : "border-white/10 text-text-tertiary hover:text-text-primary hover:border-white/20"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="py-24 text-center text-text-tertiary">
            Fetching all PHL holders from Moralis… this can take a few seconds on the first load.
          </div>
        )}

        {error && (
          <div className="py-12 text-center text-accent-bearish border border-accent-bearish/30 rounded-lg bg-accent-bearish/5">
            {error}
          </div>
        )}

        {data && !loading && (
          <>
            <div className="analytics-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-text-tertiary text-xs uppercase tracking-wider">
                      <th className="text-left py-3 px-4 font-medium">Rank</th>
                      <th className="text-left py-3 px-4 font-medium">Address</th>
                      <th className="text-left py-3 px-4 font-medium">Entity</th>
                      <th className="text-left py-3 px-4 font-medium">Label</th>
                      <th className="text-right py-3 px-4 font-medium">Balance (PHL)</th>
                      <th className="text-right py-3 px-4 font-medium">%</th>
                      <th className="text-right py-3 px-4 font-medium">USD Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((h) => (
                      <tr key={h.address} className="border-b border-white/5 hover:bg-white/[0.015] transition">
                        <td className="py-3 px-4 text-text-tertiary font-mono">#{h.rank}</td>
                        <td className="py-3 px-4">
                          <a
                            href={`https://polygonscan.com/address/${h.address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-text-primary hover:text-accent-phil transition"
                          >
                            {truncateAddress(h.address)}
                          </a>
                          {h.isContract && (
                            <span className="ml-2 text-[10px] uppercase tracking-wider text-text-muted">contract</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-text-secondary">{h.entityName ?? "—"}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs border ${LABEL_COLORS[h.label]}`}>
                            {h.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-text-primary">
                          {h.holdings.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-text-secondary">
                          {h.percentage.toFixed(4)}%
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-text-secondary">
                          {phlPrice > 0 ? formatCurrency(h.holdings * phlPrice) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 text-sm">
              <div className="text-text-tertiary">
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length.toLocaleString()}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="px-3 py-1.5 rounded-md border border-white/10 text-text-tertiary disabled:opacity-30 hover:border-white/20 hover:text-text-primary transition"
                >
                  ← Prev
                </button>
                <span className="px-3 py-1.5 text-text-secondary font-mono">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="px-3 py-1.5 rounded-md border border-white/10 text-text-tertiary disabled:opacity-30 hover:border-white/20 hover:text-text-primary transition"
                >
                  Next →
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

function StatBox({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="analytics-card p-4">
      <div className="text-xs uppercase tracking-wider text-text-tertiary mb-1">{label}</div>
      <div className={`text-xl md:text-2xl font-bold font-mono ${accent}`}>{value}</div>
    </div>
  );
}
