"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import PhilLogo from "./PhilLogo";
import {
  ECOSYSTEM,
  CATEGORY_META,
  CATEGORY_ORDER,
  STATUS_META,
  contractsByCategory,
  explorerUrl,
  type EcosystemContract,
} from "@/lib/ecosystem";

const EcosystemGlobe = dynamic(() => import("./EcosystemGlobe"), {
  ssr: false,
  loading: () => (
    <div className="w-full rounded-2xl border border-white/5 flex items-center justify-center" style={{ background: "#04040a", minHeight: 640 }}>
      <div className="font-mono text-xs text-white/40 tracking-[0.3em]">INITIALIZING ORBIT…</div>
    </div>
  ),
});

export default function ContractsView() {
  const [selected, setSelected] = useState<EcosystemContract | null>(null);
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

        <EcosystemGlobe onSelect={setSelected} />

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

      <AnimatePresence>
        {selected && <ContractModal contract={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </main>
  );
}

function ContractModal({ contract, onClose }: { contract: EcosystemContract; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const s = STATUS_META[contract.status];
  const meta = CATEGORY_META[contract.category];

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
      <motion.div
        initial={{ scale: 0.94, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.94, opacity: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
        className="relative max-w-xl w-full rounded-xl border p-6 font-mono"
        style={{
          backgroundColor: "#0a0a12",
          borderColor: s.color,
          boxShadow: `0 0 40px ${s.color}33, inset 0 0 0 1px rgba(255,255,255,0.02)`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="text-[10px] tracking-[0.3em] mb-1" style={{ color: meta.accent }}>
              {meta.label}
            </div>
            <h2 className="text-2xl font-bold text-white leading-tight font-display">{contract.name}</h2>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white text-xl" aria-label="Close">✕</button>
        </div>

        <div className="space-y-3 text-sm">
          <DetailRow label="Status" value={
            <span className="inline-flex items-center gap-2" style={{ color: s.color }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color, boxShadow: `0 0 8px ${s.color}` }} />
              {s.label}
            </span>
          } />
          <DetailRow label="Chain" value={contract.chain} />
          <DetailRow label="Type" value={contract.type.toUpperCase()} />
          <DetailRow label="Address" value={
            contract.address ? (
              <div className="flex items-center gap-2">
                <a href={explorerUrl(contract)} target="_blank" rel="noopener noreferrer" className="text-white hover:text-accent-phil transition break-all text-xs">
                  {contract.address}
                </a>
                <button
                  onClick={() => copy(contract.address)}
                  className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded border border-white/10 hover:border-accent-phil/50 hover:bg-white/5 transition"
                  title={copied ? "Copied!" : "Copy"}
                >
                  {copied
                    ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/60"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  }
                </button>
              </div>
            ) : <span className="text-white/40">not deployed</span>
          } />
          {contract.owner && (
            <DetailRow label="Owner" value={<span className="break-all text-white/80 text-xs">{contract.owner}</span>} />
          )}
          <div className="pt-3 text-white/70 leading-relaxed font-display text-[13px] border-t border-white/5">
            {contract.description}
          </div>
        </div>

        {contract.address && (
          <a href={explorerUrl(contract)} target="_blank" rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-md border text-xs tracking-[0.2em]"
            style={{ borderColor: s.color, color: s.color }}>
            VIEW ON EXPLORER →
          </a>
        )}
      </motion.div>
    </motion.div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 text-xs">
      <div className="text-white/40 uppercase tracking-[0.2em] w-20 flex-shrink-0 pt-0.5">{label}</div>
      <div className="text-white/90 flex-1">{value}</div>
    </div>
  );
}
