"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ECOSYSTEM,
  CATEGORY_META,
  CATEGORY_ORDER,
  STATUS_META,
  contractsByCategory,
  explorerUrl,
  type EcosystemContract,
  type ContractCategory,
} from "@/lib/ecosystem";

const VIEW_W = 1400;
const VIEW_H = 960;
const CX = VIEW_W / 2;
const CY = VIEW_H / 2;
const CENTER_HEX_R = 92;
const CATEGORY_HEX_R = 58;
const CONTRACT_HEX_R = 38;
const R_CATEGORY = 270;
const R_CONTRACT = 470;

function polar(cx: number, cy: number, r: number, degFromTop: number) {
  const rad = ((degFromTop - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function hexPath(cx: number, cy: number, r: number, flatTop = true): string {
  const offset = flatTop ? 0 : 30;
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const a = ((60 * i + offset) * Math.PI) / 180;
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    pts.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return `M${pts.join(" L")} Z`;
}

interface PlacedContract extends EcosystemContract {
  x: number;
  y: number;
  angle: number;
}

interface PlacedCategory {
  name: ContractCategory;
  x: number;
  y: number;
  angle: number;
  contracts: PlacedContract[];
}

function computeLayout(): PlacedCategory[] {
  return CATEGORY_ORDER.map((cat, i) => {
    const angle = (360 / CATEGORY_ORDER.length) * i;
    const pos = polar(CX, CY, R_CATEGORY, angle);
    const list = contractsByCategory(cat);
    const span = Math.min(60, 13 * Math.max(1, list.length));
    const step = list.length > 1 ? span / (list.length - 1) : 0;
    const start = angle - span / 2;
    const contracts: PlacedContract[] = list.map((c, j) => {
      const contractAngle = list.length === 1 ? angle : start + step * j;
      const cp = polar(CX, CY, R_CONTRACT, contractAngle);
      return { ...c, x: cp.x, y: cp.y, angle: contractAngle };
    });
    return { name: cat, x: pos.x, y: pos.y, angle, contracts };
  });
}

export default function EcosystemGrid() {
  const layout = useMemo(computeLayout, []);
  const [hover, setHover] = useState<EcosystemContract | null>(null);
  const [selected, setSelected] = useState<EcosystemContract | null>(null);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of ECOSYSTEM) counts[c.status] = (counts[c.status] ?? 0) + 1;
    return counts;
  }, []);

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-white/5" style={{ backgroundColor: "#05050a" }}>
      <div className="ecosystem-bg" aria-hidden />
      <div className="ecosystem-grid-floor" aria-hidden />
      <div className="ecosystem-scanlines" aria-hidden />
      <div className="ecosystem-noise" aria-hidden />

      <div className="absolute top-4 left-4 z-20 space-y-1 font-mono text-[10px] tracking-[0.2em] uppercase">
        <div className="text-cyan-400/80">◢ PHILCOIN ECOSYSTEM MAP</div>
        <div className="text-white/40">{ECOSYSTEM.length} contracts · {CATEGORY_ORDER.length} clusters</div>
      </div>

      <div className="absolute top-4 right-4 z-20 space-y-1 font-mono text-[10px] tracking-[0.18em]">
        <StatLine color="#22c55e" label="LIVE" count={statusCounts["live"] ?? 0} />
        <StatLine color="#a855f7" label="TESTNET" count={statusCounts["testnet"] ?? 0} />
        <StatLine color="#ef4444" label="PENDING MIG." count={statusCounts["pending-migration"] ?? 0} />
        <StatLine color="#64748b" label="PLANNED" count={statusCounts["planned"] ?? 0} />
      </div>

      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto block relative z-10"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="phil-core-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#F58600" stopOpacity="0.9" />
            <stop offset="60%" stopColor="#DF2908" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#DF2908" stopOpacity="0" />
          </radialGradient>

          <linearGradient id="phil-core-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a0b05" />
            <stop offset="100%" stopColor="#0a0506" />
          </linearGradient>

          <linearGradient id="phil-core-stroke" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#F58600" />
            <stop offset="50%" stopColor="#DF2908" />
            <stop offset="100%" stopColor="#F58600" />
          </linearGradient>

          {CATEGORY_ORDER.map((cat) => {
            const meta = CATEGORY_META[cat];
            return (
              <g key={`grad-${cat}`}>
                <radialGradient id={`glow-${cat}`} cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={meta.accent} stopOpacity="0.55" />
                  <stop offset="100%" stopColor={meta.accent} stopOpacity="0" />
                </radialGradient>
                <linearGradient id={`fill-${cat}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0e1020" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#05060d" stopOpacity="0.95" />
                </linearGradient>
              </g>
            );
          })}

          <filter id="neon-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="blur1" />
            <feGaussianBlur stdDeviation="6" in="SourceGraphic" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="soft-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" />
          </filter>

          <pattern id="hex-mesh" width="30" height="26" patternUnits="userSpaceOnUse" patternTransform="scale(1)">
            <path d="M15 0 L30 8.66 L30 17.32 L15 26 L0 17.32 L0 8.66 Z" fill="none" stroke="rgba(99, 102, 241, 0.04)" strokeWidth="0.5" />
          </pattern>
        </defs>

        <rect width={VIEW_W} height={VIEW_H} fill="url(#hex-mesh)" />

        {[120, 200, 280, 370, 470, 560].map((r, i) => (
          <circle key={`ring-${i}`} cx={CX} cy={CY} r={r} fill="none" stroke="rgba(99, 102, 241, 0.08)" strokeWidth="0.5" strokeDasharray="2 6" />
        ))}

        {layout.flatMap((cat) =>
          cat.contracts.map((c) => (
            <line
              key={`line-cat-${c.id}`}
              x1={cat.x}
              y1={cat.y}
              x2={c.x}
              y2={c.y}
              stroke={CATEGORY_META[cat.name].accent}
              strokeOpacity="0.18"
              strokeWidth="1"
              strokeDasharray="3 4"
            />
          ))
        )}

        {layout.map((cat) => {
          const meta = CATEGORY_META[cat.name];
          return (
            <g key={`center-line-${cat.name}`}>
              <line
                x1={CX}
                y1={CY}
                x2={cat.x}
                y2={cat.y}
                stroke={meta.accent}
                strokeOpacity="0.45"
                strokeWidth="1.5"
              />
              <circle r="3" fill={meta.accent}>
                <animateMotion
                  dur={`${3 + Math.random() * 1.5}s`}
                  repeatCount="indefinite"
                  path={`M${CX},${CY} L${cat.x},${cat.y}`}
                />
                <animate attributeName="opacity" values="0;1;0" dur="3s" repeatCount="indefinite" />
              </circle>
            </g>
          );
        })}

        <g>
          <circle cx={CX} cy={CY} r={CENTER_HEX_R + 60} fill="url(#phil-core-glow)" />
          <motion.circle
            cx={CX}
            cy={CY}
            r={CENTER_HEX_R + 30}
            fill="none"
            stroke="#F58600"
            strokeOpacity="0.25"
            strokeWidth="1"
            initial={{ r: CENTER_HEX_R }}
            animate={{ r: [CENTER_HEX_R + 5, CENTER_HEX_R + 50], opacity: [0.55, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeOut" }}
          />
          <motion.circle
            cx={CX}
            cy={CY}
            r={CENTER_HEX_R + 30}
            fill="none"
            stroke="#DF2908"
            strokeOpacity="0.3"
            strokeWidth="1"
            initial={{ r: CENTER_HEX_R }}
            animate={{ r: [CENTER_HEX_R + 5, CENTER_HEX_R + 60], opacity: [0.5, 0] }}
            transition={{ duration: 3, delay: 1.2, repeat: Infinity, ease: "easeOut" }}
          />
          <path d={hexPath(CX, CY, CENTER_HEX_R, true)} fill="url(#phil-core-fill)" stroke="url(#phil-core-stroke)" strokeWidth="2" filter="url(#neon-glow)" />
          <path d={hexPath(CX, CY, CENTER_HEX_R - 12, true)} fill="none" stroke="rgba(245, 134, 0, 0.4)" strokeWidth="0.8" />
          <g transform={`translate(${CX - 42}, ${CY - 42})`}>
            <svg width="84" height="84" viewBox="0 0 52 51" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M26.1165 50.8659C40.0069 50.8659 51.2672 39.6055 51.2672 25.7152C51.2672 11.8248 40.0069 0.564453 26.1165 0.564453C12.2262 0.564453 0.96582 11.8248 0.96582 25.7152C0.96582 39.6055 12.2262 50.8659 26.1165 50.8659Z" fill="white"/>
              <path d="M29.1625 23.6748L23.71 26.8226C23.6174 26.8764 23.5405 26.9536 23.4871 27.0465C23.4338 27.1394 23.4057 27.2446 23.4058 27.3517V29.6521C23.4056 29.7594 23.4336 29.8648 23.4871 29.9577C23.5406 30.0507 23.6176 30.1278 23.7104 30.1815C23.8033 30.2352 23.9086 30.2634 24.0158 30.2634C24.1231 30.2633 24.2284 30.235 24.3212 30.1813L35.5926 23.6734C35.6854 23.6199 35.7626 23.5429 35.8162 23.4501C35.8698 23.3574 35.8981 23.2521 35.8981 23.145C35.8981 23.0378 35.8698 22.9325 35.8162 22.8398C35.7626 22.747 35.6854 22.67 35.5926 22.6165L19.4954 13.323C19.4026 13.2692 19.2973 13.2409 19.1901 13.2409C19.0829 13.2408 18.9775 13.2691 18.8847 13.3227C18.7918 13.3764 18.7148 13.4536 18.6613 13.5465C18.6078 13.6395 18.5798 13.7449 18.5801 13.8521V38.152C18.58 38.2163 18.5968 38.2795 18.6289 38.3353C18.6609 38.391 18.7071 38.4373 18.7627 38.4696C18.8183 38.5018 18.8814 38.5189 18.9457 38.519C19.01 38.5192 19.0732 38.5024 19.129 38.4703L21.4436 37.1405C21.5503 37.0792 21.639 36.9908 21.7006 36.8842C21.7622 36.7776 21.7946 36.6566 21.7944 36.5335V19.4206C21.7946 19.3135 21.8229 19.2084 21.8765 19.1157C21.93 19.023 22.007 18.946 22.0997 18.8924C22.1924 18.8389 22.2976 18.8106 22.4046 18.8104C22.5117 18.8102 22.6169 18.8382 22.7098 18.8915L29.1625 22.618C29.2553 22.6714 29.3325 22.7484 29.3861 22.8412C29.4397 22.934 29.468 23.0392 29.468 23.1464C29.468 23.2535 29.4397 23.3588 29.3861 23.4515C29.3325 23.5443 29.2553 23.6213 29.1625 23.6748Z" fill="url(#phil-logo-grad)"/>
              <path d="M31.4609 31.4289L35.3727 29.1654C35.5331 29.0727 35.6664 28.9395 35.759 28.7791C35.8516 28.6186 35.9004 28.4366 35.9004 28.2514V26.565C35.8998 26.4327 35.8646 26.3029 35.7983 26.1885C35.732 26.074 35.637 25.9789 35.5226 25.9125C35.4081 25.8462 35.2784 25.8109 35.1461 25.8102C35.0138 25.8095 34.8837 25.8434 34.7686 25.9086L25.6787 31.1559C25.5633 31.2224 25.4673 31.3181 25.4006 31.4335C25.3339 31.5489 25.2988 31.6798 25.2988 31.8131C25.2988 31.9463 25.3339 32.0773 25.4006 32.1926C25.4673 32.308 25.5633 32.4037 25.6787 32.4702L34.7686 37.7176C34.8837 37.7827 35.0138 37.8166 35.1461 37.8159C35.2784 37.8152 35.4081 37.7799 35.5226 37.7136C35.637 37.6472 35.732 37.5521 35.7983 37.4377C35.8646 37.3232 35.8998 37.1934 35.9004 37.0611V35.3747C35.9005 35.1894 35.8518 35.0074 35.7592 34.8469C35.6665 34.6865 35.5332 34.5533 35.3727 34.4608L31.4609 32.1972C31.395 32.157 31.3406 32.1006 31.3028 32.0333C31.2651 31.966 31.2452 31.8902 31.2452 31.8131C31.2452 31.7359 31.2651 31.6601 31.3028 31.5928C31.3406 31.5255 31.395 31.4691 31.4609 31.4289Z" fill="url(#phil-logo-grad)"/>
              <path d="M25.4945 38.5179C26.7993 38.5179 27.8571 37.4601 27.8571 36.1553C27.8571 34.8504 26.7993 33.7926 25.4945 33.7926C24.1896 33.7926 23.1318 34.8504 23.1318 36.1553C23.1318 37.4601 24.1896 38.5179 25.4945 38.5179Z" fill="url(#phil-logo-grad)"/>
              <defs>
                <linearGradient id="phil-logo-grad" x1="27" y1="13" x2="27" y2="38" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#DF2908" />
                  <stop offset="1" stopColor="#F58600" />
                </linearGradient>
              </defs>
            </svg>
          </g>
          <text x={CX} y={CY + CENTER_HEX_R + 22} textAnchor="middle" fill="#F58600" fontSize="11" fontFamily="var(--font-jetbrains), monospace" letterSpacing="4" fontWeight="600">
            PHILCOIN · CORE
          </text>
        </g>

        {layout.map((cat) => {
          const meta = CATEGORY_META[cat.name];
          return (
            <g key={`cat-${cat.name}`}>
              <circle cx={cat.x} cy={cat.y} r={CATEGORY_HEX_R + 30} fill={`url(#glow-${cat.name})`} opacity="0.6" />
              <path
                d={hexPath(cat.x, cat.y, CATEGORY_HEX_R, true)}
                fill={`url(#fill-${cat.name})`}
                stroke={meta.accent}
                strokeWidth="1.5"
                filter="url(#neon-glow)"
              />
              <path
                d={hexPath(cat.x, cat.y, CATEGORY_HEX_R - 8, true)}
                fill="none"
                stroke={meta.accent}
                strokeOpacity="0.3"
                strokeWidth="0.6"
              />
              <text
                x={cat.x}
                y={cat.y - 4}
                textAnchor="middle"
                fill={meta.accent}
                fontSize="11"
                fontFamily="var(--font-jetbrains), monospace"
                letterSpacing="3"
                fontWeight="700"
              >
                {meta.label}
              </text>
              <text
                x={cat.x}
                y={cat.y + 12}
                textAnchor="middle"
                fill="rgba(255,255,255,0.45)"
                fontSize="9"
                fontFamily="var(--font-jetbrains), monospace"
              >
                [{cat.contracts.length}]
              </text>
            </g>
          );
        })}

        {layout.flatMap((cat) =>
          cat.contracts.map((c) => {
            const statusColor = STATUS_META[c.status].color;
            const isHover = hover?.id === c.id;
            const isSelected = selected?.id === c.id;
            return (
              <motion.g
                key={c.id}
                style={{ cursor: "pointer", transformBox: "fill-box", transformOrigin: "center" }}
                onMouseEnter={() => setHover(c)}
                onMouseLeave={() => setHover((h) => (h?.id === c.id ? null : h))}
                onClick={() => setSelected(c)}
                whileHover={{ scale: 1.08 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                transform={`translate(${c.x} ${c.y})`}
              >
                <circle cx={0} cy={0} r={CONTRACT_HEX_R + 15} fill={statusColor} opacity={isHover || isSelected ? 0.28 : 0.12} />
                <path
                  d={hexPath(0, 0, CONTRACT_HEX_R, true)}
                  fill="#08090f"
                  stroke={statusColor}
                  strokeWidth={isHover || isSelected ? 2 : 1.3}
                  filter={isHover ? "url(#neon-glow)" : undefined}
                />
                <path
                  d={hexPath(0, 0, CONTRACT_HEX_R - 6, true)}
                  fill="none"
                  stroke={statusColor}
                  strokeOpacity="0.3"
                  strokeWidth="0.5"
                />
                {c.status === "pending-migration" && (
                  <motion.circle
                    cx={0}
                    cy={0}
                    r={CONTRACT_HEX_R - 4}
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="1"
                    animate={{ opacity: [0.2, 0.9, 0.2] }}
                    transition={{ duration: 1.6, repeat: Infinity }}
                  />
                )}
                <text
                  y="-2"
                  textAnchor="middle"
                  fill="#f1f5f9"
                  fontSize="8.5"
                  fontFamily="var(--font-jetbrains), monospace"
                  fontWeight="600"
                  letterSpacing="0.5"
                >
                  {c.shortName.toUpperCase().slice(0, 11)}
                </text>
                <text
                  y="10"
                  textAnchor="middle"
                  fill={statusColor}
                  fontSize="7"
                  fontFamily="var(--font-jetbrains), monospace"
                  letterSpacing="0.8"
                >
                  {c.address ? c.address.slice(-4).toUpperCase() : "—"}
                </text>
              </motion.g>
            );
          })
        )}

        {hover && (
          <HoverTooltip contract={hover} />
        )}
      </svg>

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex items-center justify-center p-4 md:p-8"
            onClick={() => setSelected(null)}
          >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <motion.div
              initial={{ scale: 0.92, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
              className="relative max-w-xl w-full rounded-xl border p-6 font-mono"
              style={{
                backgroundColor: "#0a0a12",
                borderColor: STATUS_META[selected.status].color,
                boxShadow: `0 0 40px ${STATUS_META[selected.status].color}33, inset 0 0 0 1px rgba(255,255,255,0.02)`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-5">
                <div>
                  <div
                    className="text-[10px] tracking-[0.3em] mb-1"
                    style={{ color: CATEGORY_META[selected.category].accent }}
                  >
                    {CATEGORY_META[selected.category].label}
                  </div>
                  <h2 className="text-2xl font-bold text-white leading-tight font-display">
                    {selected.name}
                  </h2>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="text-white/40 hover:text-white text-xl"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-sm">
                <DetailRow label="Status" value={
                  <span className="inline-flex items-center gap-2" style={{ color: STATUS_META[selected.status].color }}>
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_META[selected.status].color, boxShadow: `0 0 8px ${STATUS_META[selected.status].color}` }} />
                    {STATUS_META[selected.status].label}
                  </span>
                } />
                <DetailRow label="Chain" value={selected.chain} />
                <DetailRow label="Type" value={selected.type.toUpperCase()} />
                <DetailRow label="Address" value={
                  selected.address ? (
                    <a
                      href={explorerUrl(selected)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white hover:text-accent-phil transition break-all"
                    >
                      {selected.address}
                    </a>
                  ) : <span className="text-white/40">not deployed</span>
                } />
                {selected.owner && (
                  <DetailRow label="Owner" value={<span className="break-all text-white/80">{selected.owner}</span>} />
                )}
                <div className="pt-3 text-white/70 leading-relaxed font-display text-[13px] border-t border-white/5">
                  {selected.description}
                </div>
              </div>

              {selected.address && (
                <a
                  href={explorerUrl(selected)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-md border text-xs tracking-[0.2em]"
                  style={{ borderColor: STATUS_META[selected.status].color, color: STATUS_META[selected.status].color }}
                >
                  VIEW ON EXPLORER →
                </a>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .ecosystem-bg {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 60% 60% at 50% 50%, rgba(99, 102, 241, 0.08) 0%, transparent 60%),
            radial-gradient(ellipse 80% 50% at 50% 100%, rgba(168, 85, 247, 0.05) 0%, transparent 70%),
            radial-gradient(ellipse 40% 40% at 50% 50%, rgba(245, 134, 0, 0.06) 0%, transparent 70%);
          pointer-events: none;
        }
        .ecosystem-grid-floor {
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.22;
          background-image:
            linear-gradient(rgba(99, 102, 241, 0.25) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99, 102, 241, 0.25) 1px, transparent 1px);
          background-size: 48px 48px;
          mask-image: radial-gradient(ellipse 70% 70% at 50% 50%, black 0%, transparent 80%);
          -webkit-mask-image: radial-gradient(ellipse 70% 70% at 50% 50%, black 0%, transparent 80%);
        }
        .ecosystem-scanlines {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: repeating-linear-gradient(
            to bottom,
            transparent 0px,
            transparent 2px,
            rgba(255, 255, 255, 0.012) 2px,
            rgba(255, 255, 255, 0.012) 3px
          );
        }
        .ecosystem-noise {
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.06;
          mix-blend-mode: overlay;
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
        }
      `}</style>
    </div>
  );
}

function HoverTooltip({ contract }: { contract: EcosystemContract }) {
  const meta = CATEGORY_META[contract.category];
  const status = STATUS_META[contract.status];
  return (
    <foreignObject x={20} y={VIEW_H - 130} width={VIEW_W - 40} height={120} pointerEvents="none">
      <div className="flex items-center justify-center">
        <div
          className="px-4 py-2 rounded-lg border font-mono text-xs backdrop-blur-md"
          style={{
            borderColor: status.color,
            backgroundColor: "rgba(5,5,10,0.85)",
            boxShadow: `0 0 20px ${status.color}44`,
          }}
        >
          <span style={{ color: meta.accent }} className="tracking-[0.2em]">{meta.label}</span>
          <span className="text-white/40 mx-2">/</span>
          <span className="text-white">{contract.name}</span>
          <span className="text-white/40 mx-2">·</span>
          <span style={{ color: status.color }}>{status.label}</span>
          {contract.address && (
            <>
              <span className="text-white/40 mx-2">·</span>
              <span className="text-white/60">{contract.address.slice(0, 10)}…{contract.address.slice(-6)}</span>
            </>
          )}
        </div>
      </div>
    </foreignObject>
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

function StatLine({ color, label, count }: { color: string; label: string; count: number }) {
  return (
    <div className="flex items-center justify-end gap-2">
      <span style={{ color }} className="tabular-nums w-4 text-right">{count.toString().padStart(2, "0")}</span>
      <span className="text-white/50">{label}</span>
      <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }} />
    </div>
  );
}
