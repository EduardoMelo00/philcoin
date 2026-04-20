"use client";

import Link from "next/link";
import PhilLogo from "./PhilLogo";
import EcosystemGrid from "./EcosystemGrid";
import {
  ECOSYSTEM,
  CATEGORY_META,
  CATEGORY_ORDER,
  STATUS_META,
  contractsByCategory,
  explorerUrl,
} from "@/lib/ecosystem";

export default function ContractsView() {
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
            <Link href="/holders" className="px-3 py-1.5 rounded-md text-text-tertiary hover:text-text-primary hover:bg-white/5 transition">Holders</Link>
            <Link href="/contracts" className="px-3 py-1.5 rounded-md text-text-primary bg-accent-phil/10 border border-accent-phil/30">Contracts</Link>
          </nav>
        </div>
      </header>

      <section className="max-w-[1440px] mx-auto px-4 md:px-6 pt-8">
        <div className="mb-6">
          <div className="font-mono text-[10px] tracking-[0.3em] text-cyan-400/80 mb-2">◢ ECOSYSTEM MAP</div>
          <h1 className="text-3xl md:text-4xl font-bold text-text-primary tracking-tight">
            Smart Contract Atlas
          </h1>
          <p className="text-text-secondary mt-2 max-w-2xl">
            All deployed contracts across the PHILCOIN and PhilSocial ecosystem.
            Click any node to view details. Pulsing red hexagons are pending migration from the compromised key.
          </p>
        </div>

        <EcosystemGrid />

        <div className="mt-10">
          <h2 className="text-lg font-semibold text-text-primary mb-4 tracking-tight">
            Contract Registry
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {CATEGORY_ORDER.map((cat) => {
              const meta = CATEGORY_META[cat];
              const list = contractsByCategory(cat);
              return (
                <div
                  key={cat}
                  className="analytics-card p-5"
                  style={{ borderColor: `${meta.accent}33` }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-[10px] tracking-[0.3em] font-mono" style={{ color: meta.accent }}>
                        {meta.label}
                      </div>
                      <div className="text-sm text-text-secondary">{meta.description}</div>
                    </div>
                    <div className="text-2xl font-bold font-mono" style={{ color: meta.accent }}>
                      {list.length}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    {list.map((c) => {
                      const s = STATUS_META[c.status];
                      return (
                        <a
                          key={c.id}
                          href={c.address ? explorerUrl(c) : undefined}
                          target={c.address ? "_blank" : undefined}
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 px-3 py-2 rounded-md border border-white/5 hover:border-white/15 hover:bg-white/[0.02] transition group"
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: s.color, boxShadow: `0 0 8px ${s.color}` }}
                          />
                          <span className="text-text-primary text-sm font-medium flex-1 truncate">
                            {c.name}
                          </span>
                          {c.address ? (
                            <span className="text-text-tertiary text-xs font-mono group-hover:text-accent-phil transition">
                              {c.address.slice(0, 6)}…{c.address.slice(-4)}
                            </span>
                          ) : (
                            <span className="text-text-muted text-xs font-mono">not deployed</span>
                          )}
                        </a>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-10 analytics-card p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-3 tracking-tight flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-bearish animate-pulse" />
            Key Rotation Status
          </h3>
          <p className="text-sm text-text-secondary mb-3">
            12 legacy contracts still owned by the compromised wallet
            <code className="mx-1.5 px-1.5 py-0.5 rounded bg-white/5 text-accent-bearish text-[11px]">0xB8BB…A961</code>
            — migration to the KMS-managed wallet
            <code className="mx-1.5 px-1.5 py-0.5 rounded bg-white/5 text-accent-bullish text-[11px]">0xc421…58Ca6</code>
            is pending execution. The <strong className="text-text-primary">Rewards</strong> contract has already been migrated.
          </p>
          <div className="flex items-center gap-6 text-xs font-mono pt-3 border-t border-white/5">
            <div className="flex items-center gap-2">
              <span className="text-text-tertiary uppercase tracking-wider">Total</span>
              <span className="text-text-primary font-semibold">{ECOSYSTEM.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-bullish" />
              <span className="text-text-primary">{ECOSYSTEM.filter((c) => c.status === "live").length} live</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
              <span className="text-text-primary">{ECOSYSTEM.filter((c) => c.status === "testnet").length} testnet</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-bearish animate-pulse" />
              <span className="text-text-primary">{ECOSYSTEM.filter((c) => c.status === "pending-migration").length} pending</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
              <span className="text-text-primary">{ECOSYSTEM.filter((c) => c.status === "planned").length} planned</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
