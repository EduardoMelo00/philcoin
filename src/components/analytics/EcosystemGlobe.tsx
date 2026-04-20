"use client";

import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, Line, OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";
import {
  CATEGORY_META,
  CATEGORY_ORDER,
  STATUS_META,
  contractsByCategory,
  type EcosystemContract,
  type ContractCategory,
} from "@/lib/ecosystem";

type SatelliteLayout = {
  contract: EcosystemContract;
  ringIndex: number;
  position: THREE.Vector3;
  baseOffset: number;
};

type Orbit = {
  category: ContractCategory;
  radius: number;
  tilt: [number, number, number];
  speed: number;
  color: string;
};

const ORBITS: Orbit[] = [
  { category: "Core",     radius: 3.2, tilt: [0.08, 0, 0.10],  speed: 0.05, color: "#F58600" },
  { category: "Founders", radius: 3.9, tilt: [0.32, 0.6, 0],   speed: 0.04, color: "#fbbf24" },
  { category: "Payments", radius: 4.3, tilt: [-0.25, 0.3, 0.15], speed: 0.035, color: "#a855f7" },
  { category: "Lending",  radius: 4.7, tilt: [0.45, -0.4, 0.2], speed: 0.03, color: "#22d3ee" },
  { category: "Rewards",  radius: 5.1, tilt: [-0.35, 0.8, -0.1], speed: 0.025, color: "#ec4899" },
];

function computeOrbits(): { orbit: Orbit; satellites: SatelliteLayout[] }[] {
  return ORBITS.map((orbit, ringIndex) => {
    const list = contractsByCategory(orbit.category);
    const satellites = list.map((contract, j) => {
      const t = (j / Math.max(1, list.length)) * Math.PI * 2;
      return {
        contract,
        ringIndex,
        position: new THREE.Vector3(),
        baseOffset: t,
      };
    });
    return { orbit, satellites };
  });
}

function WireframeCore() {
  const group = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.08;
      group.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.15) * 0.08;
    }
    if (inner.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.03;
      inner.current.scale.setScalar(pulse);
    }
  });

  return (
    <group ref={group}>
      <mesh>
        <icosahedronGeometry args={[1.9, 2]} />
        <meshBasicMaterial color="#F58600" wireframe transparent opacity={0.45} />
      </mesh>

      <mesh>
        <sphereGeometry args={[1.85, 24, 16]} />
        <meshBasicMaterial color="#22d3ee" wireframe transparent opacity={0.12} />
      </mesh>

      <mesh ref={inner}>
        <sphereGeometry args={[1.55, 64, 64]} />
        <meshBasicMaterial color="#1a0a04" transparent opacity={0.9} />
      </mesh>

      <mesh>
        <sphereGeometry args={[1.6, 32, 32]} />
        <meshBasicMaterial color="#DF2908" transparent opacity={0.12} />
      </mesh>
    </group>
  );
}

function EquatorRings() {
  const points = useMemo(() => {
    const rings: { id: string; pts: THREE.Vector3[]; color: string; tilt: [number, number, number]; radius: number }[] = [];
    for (const orbit of ORBITS) {
      const segments = 128;
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= segments; i++) {
        const t = (i / segments) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(t) * orbit.radius, 0, Math.sin(t) * orbit.radius));
      }
      rings.push({ id: orbit.category, pts, color: orbit.color, tilt: orbit.tilt, radius: orbit.radius });
    }
    return rings;
  }, []);

  return (
    <>
      {points.map((r) => (
        <group key={r.id} rotation={r.tilt}>
          <Line points={r.pts} color={r.color} transparent opacity={0.28} lineWidth={1} dashed dashSize={0.18} gapSize={0.14} />
        </group>
      ))}
    </>
  );
}

function Satellites({
  onHover,
  onSelect,
  selectedId,
}: {
  onHover: (c: EcosystemContract | null) => void;
  onSelect: (c: EcosystemContract) => void;
  selectedId: string | null;
}) {
  const data = useMemo(computeOrbits, []);
  const groupRefs = useRef<Record<string, THREE.Group | null>>({});

  useFrame((_, delta) => {
    for (const { orbit } of data) {
      const g = groupRefs.current[orbit.category];
      if (g) g.rotation.y += delta * orbit.speed;
    }
  });

  return (
    <>
      {data.map(({ orbit, satellites }) => (
        <group key={orbit.category} rotation={orbit.tilt}>
          <group ref={(el) => { groupRefs.current[orbit.category] = el; }}>
            {satellites.map((s) => {
              const pos = new THREE.Vector3(
                Math.cos(s.baseOffset) * orbit.radius,
                0,
                Math.sin(s.baseOffset) * orbit.radius,
              );
              return (
                <Satellite
                  key={s.contract.id}
                  contract={s.contract}
                  orbitColor={orbit.color}
                  position={pos}
                  isSelected={selectedId === s.contract.id}
                  onHover={onHover}
                  onSelect={onSelect}
                />
              );
            })}
          </group>
        </group>
      ))}
    </>
  );
}

function Satellite({
  contract,
  orbitColor,
  position,
  isSelected,
  onHover,
  onSelect,
}: {
  contract: EcosystemContract;
  orbitColor: string;
  position: THREE.Vector3;
  isSelected: boolean;
  onHover: (c: EcosystemContract | null) => void;
  onSelect: (c: EcosystemContract) => void;
}) {
  const statusColor = STATUS_META[contract.status].color;
  const [hovered, setHovered] = useState(false);

  const nodeSize = isSelected || hovered ? 0.12 : 0.08;
  const pulse = contract.status === "pending-migration";

  return (
    <group position={position}>
      <mesh
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); onHover(contract); document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { setHovered(false); onHover(null); document.body.style.cursor = "default"; }}
        onClick={(e) => { e.stopPropagation(); onSelect(contract); }}
      >
        <sphereGeometry args={[nodeSize, 16, 16]} />
        <meshBasicMaterial color={statusColor} />
      </mesh>

      <mesh>
        <sphereGeometry args={[nodeSize * 2.5, 16, 16]} />
        <meshBasicMaterial color={statusColor} transparent opacity={hovered ? 0.35 : 0.15} />
      </mesh>

      {pulse && <PulseRing color={statusColor} />}

      <Html
        position={[0, 0, 0]}
        center
        distanceFactor={9}
        zIndexRange={[0, 10]}
        style={{ pointerEvents: "none" }}
        wrapperClass="satellite-html"
      >
        <SatelliteCard
          contract={contract}
          orbitColor={orbitColor}
          statusColor={statusColor}
          onSelect={onSelect}
        />
      </Html>
    </group>
  );
}

function PulseRing({ color }: { color: string }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime * 1.2;
    const s = 1 + (Math.sin(t) * 0.5 + 0.5) * 2;
    ref.current.scale.setScalar(s);
    const m = ref.current.material as THREE.MeshBasicMaterial;
    m.opacity = Math.max(0, 0.4 - (s - 1) * 0.18);
  });
  return (
    <mesh ref={ref}>
      <ringGeometry args={[0.2, 0.24, 32]} />
      <meshBasicMaterial color={color} transparent side={THREE.DoubleSide} opacity={0.4} />
    </mesh>
  );
}

function SatelliteCard({
  contract,
  orbitColor,
  statusColor,
  onSelect,
}: {
  contract: EcosystemContract;
  orbitColor: string;
  statusColor: string;
  onSelect: (c: EcosystemContract) => void;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!contract.address) return;
    try {
      await navigator.clipboard.writeText(contract.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div
      className="select-none"
      style={{
        transform: "translate(14px, -50%)",
        minWidth: 200,
        pointerEvents: "none",
      }}
    >
      <div
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-md font-mono text-[10px] backdrop-blur-sm"
        style={{
          background: "rgba(5, 5, 12, 0.78)",
          border: `1px solid ${orbitColor}55`,
          boxShadow: `0 0 14px ${orbitColor}22`,
          pointerEvents: "none",
        }}
      >
        <span
          className="flex-shrink-0 w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: statusColor, boxShadow: `0 0 6px ${statusColor}` }}
        />
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onSelect(contract); }}
          className="text-white hover:text-white transition whitespace-nowrap font-semibold text-[11px] cursor-pointer"
          style={{ color: "#f1f5f9", pointerEvents: "auto" }}
        >
          {contract.shortName}
        </button>
        {contract.address && (
          <>
            <span className="text-white/30">·</span>
            <span className="text-white/60 tracking-wider">
              {contract.address.slice(0, 6)}…{contract.address.slice(-4)}
            </span>
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={copy}
              className="ml-0.5 w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 transition cursor-pointer"
              style={{ pointerEvents: "auto" }}
              title={copied ? "Copied!" : "Copy address"}
            >
              {copied ? (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              ) : (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: orbitColor }}>
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function LightningArcs() {
  const arcsRef = useRef<{ key: string; points: THREE.Vector3[]; opacity: number; lifetime: number }[]>([]);
  const [, forceUpdate] = useState(0);

  useFrame((state, delta) => {
    if (Math.random() < 0.08) {
      const target = new THREE.Vector3(
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 8,
      );
      const start = target.clone().setLength(1.95);
      const segments = 8;
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const p = new THREE.Vector3().lerpVectors(start, target, t);
        if (i > 0 && i < segments) {
          p.x += (Math.random() - 0.5) * 0.25;
          p.y += (Math.random() - 0.5) * 0.25;
          p.z += (Math.random() - 0.5) * 0.25;
        }
        pts.push(p);
      }
      arcsRef.current.push({
        key: `arc-${state.clock.elapsedTime}-${Math.random()}`,
        points: pts,
        opacity: 1,
        lifetime: 0.35 + Math.random() * 0.25,
      });
    }

    arcsRef.current = arcsRef.current
      .map((a) => ({ ...a, opacity: a.opacity - delta / a.lifetime }))
      .filter((a) => a.opacity > 0);

    forceUpdate((n) => (n + 1) % 1000);
  });

  return (
    <>
      {arcsRef.current.map((a) => (
        <Line
          key={a.key}
          points={a.points}
          color="#F58600"
          transparent
          opacity={a.opacity * 0.9}
          lineWidth={2.2}
        />
      ))}
    </>
  );
}


export default function EcosystemGlobe({
  onSelect,
}: {
  onSelect?: (c: EcosystemContract) => void;
}) {
  const [hover, setHover] = useState<EcosystemContract | null>(null);
  const [internalSelected, setInternalSelected] = useState<EcosystemContract | null>(null);

  const handleSelect = (c: EcosystemContract) => {
    setInternalSelected(c);
    onSelect?.(c);
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-white/5" style={{ background: "#04040a", minHeight: 640, height: "min(78vh, 780px)" }}>
      <div className="ecosystem-globe-bg" aria-hidden />
      <div className="ecosystem-globe-scanlines" aria-hidden />

      <div className="absolute top-4 left-4 z-10 font-mono text-[10px] tracking-[0.3em] uppercase pointer-events-none">
        <div className="text-cyan-400/80">◢ PHILCOIN ECOSYSTEM ORBIT</div>
        <div className="text-white/40 mt-0.5">drag to rotate · scroll to zoom · click node for details</div>
      </div>

      <div className="absolute top-4 right-4 z-10 space-y-1 font-mono text-[10px] tracking-[0.2em] pointer-events-none">
        {CATEGORY_ORDER.map((c) => (
          <div key={c} className="flex items-center justify-end gap-2">
            <span className="text-white/55">{CATEGORY_META[c].label}</span>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: CATEGORY_META[c].accent, boxShadow: `0 0 8px ${CATEGORY_META[c].accent}` }} />
          </div>
        ))}
      </div>

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
        <div className="relative">
          <div className="absolute inset-0 blur-2xl" style={{ background: "radial-gradient(circle, rgba(245,134,0,0.55) 0%, transparent 70%)", width: 240, height: 240, transform: "translate(-50%,-50%)", left: "50%", top: "50%" }} />
          <div className="relative" style={{ filter: "drop-shadow(0 0 18px rgba(245,134,0,0.8)) drop-shadow(0 0 40px rgba(223,41,8,0.5))" }}>
            <svg width="110" height="110" viewBox="0 0 52 51" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="26" cy="25.7" r="24.5" fill="white" />
              <path d="M29.1625 23.6748L23.71 26.8226C23.6174 26.8764 23.5405 26.9536 23.4871 27.0465C23.4338 27.1394 23.4057 27.2446 23.4058 27.3517V29.6521C23.4056 29.7594 23.4336 29.8648 23.4871 29.9577C23.5406 30.0507 23.6176 30.1278 23.7104 30.1815C23.8033 30.2352 23.9086 30.2634 24.0158 30.2634C24.1231 30.2633 24.2284 30.235 24.3212 30.1813L35.5926 23.6734C35.6854 23.6199 35.7626 23.5429 35.8162 23.4501C35.8698 23.3574 35.8981 23.2521 35.8981 23.145C35.8981 23.0378 35.8698 22.9325 35.8162 22.8398C35.7626 22.747 35.6854 22.67 35.5926 22.6165L19.4954 13.323C19.4026 13.2692 19.2973 13.2409 19.1901 13.2409C19.0829 13.2408 18.9775 13.2691 18.8847 13.3227C18.7918 13.3764 18.7148 13.4536 18.6613 13.5465C18.6078 13.6395 18.5798 13.7449 18.5801 13.8521V38.152C18.58 38.2163 18.5968 38.2795 18.6289 38.3353C18.6609 38.391 18.7071 38.4373 18.7627 38.4696C18.8183 38.5018 18.8814 38.5189 18.9457 38.519C19.01 38.5192 19.0732 38.5024 19.129 38.4703L21.4436 37.1405C21.5503 37.0792 21.639 36.9908 21.7006 36.8842C21.7622 36.7776 21.7946 36.6566 21.7944 36.5335V19.4206C21.7946 19.3135 21.8229 19.2084 21.8765 19.1157C21.93 19.023 22.007 18.946 22.0997 18.8924C22.1924 18.8389 22.2976 18.8106 22.4046 18.8104C22.5117 18.8102 22.6169 18.8382 22.7098 18.8915L29.1625 22.618C29.2553 22.6714 29.3325 22.7484 29.3861 22.8412C29.4397 22.934 29.468 23.0392 29.468 23.1464C29.468 23.2535 29.4397 23.3588 29.3861 23.4515C29.3325 23.5443 29.2553 23.6213 29.1625 23.6748Z" fill="url(#hero-phil-grad)"/>
              <path d="M31.4609 31.4289L35.3727 29.1654C35.5331 29.0727 35.6664 28.9395 35.759 28.7791C35.8516 28.6186 35.9004 28.4366 35.9004 28.2514V26.565C35.8998 26.4327 35.8646 26.3029 35.7983 26.1885C35.732 26.074 35.637 25.9789 35.5226 25.9125C35.4081 25.8462 35.2784 25.8109 35.1461 25.8102C35.0138 25.8095 34.8837 25.8434 34.7686 25.9086L25.6787 31.1559C25.5633 31.2224 25.4673 31.3181 25.4006 31.4335C25.3339 31.5489 25.2988 31.6798 25.2988 31.8131C25.2988 31.9463 25.3339 32.0773 25.4006 32.1926C25.4673 32.308 25.5633 32.4037 25.6787 32.4702L34.7686 37.7176C34.8837 37.7827 35.0138 37.8166 35.1461 37.8159C35.2784 37.8152 35.4081 37.7799 35.5226 37.7136C35.637 37.6472 35.732 37.5521 35.7983 37.4377C35.8646 37.3232 35.8998 37.1934 35.9004 37.0611V35.3747C35.9005 35.1894 35.8518 35.0074 35.7592 34.8469C35.6665 34.6865 35.5332 34.5533 35.3727 34.4608L31.4609 32.1972C31.395 32.157 31.3406 32.1006 31.3028 32.0333C31.2651 31.966 31.2452 31.8902 31.2452 31.8131C31.2452 31.7359 31.2651 31.6601 31.3028 31.5928C31.3406 31.5255 31.395 31.4691 31.4609 31.4289Z" fill="url(#hero-phil-grad)"/>
              <path d="M25.4945 38.5179C26.7993 38.5179 27.8571 37.4601 27.8571 36.1553C27.8571 34.8504 26.7993 33.7926 25.4945 33.7926C24.1896 33.7926 23.1318 34.8504 23.1318 36.1553C23.1318 37.4601 24.1896 38.5179 25.4945 38.5179Z" fill="url(#hero-phil-grad)"/>
              <defs>
                <linearGradient id="hero-phil-grad" x1="27" y1="13" x2="27" y2="38" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#DF2908"/><stop offset="1" stopColor="#F58600"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="text-center mt-4 font-mono text-[10px] tracking-[0.4em] text-[#F58600]/90">
            PHILCOIN · CORE
          </div>
        </div>
      </div>

      <Canvas
        camera={{ position: [0, 0.5, 8.5], fov: 45 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        style={{ position: "absolute", inset: 0 }}
      >
        <color attach="background" args={["#04040a"]} />
        <fog attach="fog" args={["#04040a", 8, 18]} />
        <ambientLight intensity={0.4} />
        <pointLight position={[0, 0, 0]} color="#F58600" intensity={8} distance={10} />
        <pointLight position={[5, 3, 5]} color="#22d3ee" intensity={1.2} />
        <pointLight position={[-5, -2, -5]} color="#a855f7" intensity={0.8} />

        <Stars radius={40} depth={60} count={1400} factor={2.5} saturation={0} fade speed={0.4} />

        <OrbitControls
          enablePan={false}
          enableZoom
          enableDamping
          dampingFactor={0.08}
          rotateSpeed={0.6}
          zoomSpeed={0.6}
          minDistance={5}
          maxDistance={16}
          autoRotate
          autoRotateSpeed={0.35}
          makeDefault
        />
        <WireframeCore />
        <EquatorRings />
        <LightningArcs />
        <Satellites
          onHover={setHover}
          onSelect={handleSelect}
          selectedId={internalSelected?.id ?? null}
        />
      </Canvas>

      {hover && (
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 px-4 py-2 rounded-lg border font-mono text-xs backdrop-blur-md pointer-events-none"
          style={{
            borderColor: STATUS_META[hover.status].color,
            backgroundColor: "rgba(5,5,10,0.9)",
            boxShadow: `0 0 16px ${STATUS_META[hover.status].color}33`,
          }}
        >
          <span style={{ color: CATEGORY_META[hover.category].accent }} className="tracking-[0.2em]">{CATEGORY_META[hover.category].label}</span>
          <span className="text-white/40 mx-2">/</span>
          <span className="text-white">{hover.name}</span>
          <span className="text-white/40 mx-2">·</span>
          <span style={{ color: STATUS_META[hover.status].color }}>{STATUS_META[hover.status].label}</span>
        </div>
      )}

      <style jsx>{`
        .ecosystem-globe-bg {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            radial-gradient(ellipse 50% 50% at 50% 50%, rgba(245, 134, 0, 0.12) 0%, transparent 60%),
            radial-gradient(ellipse 80% 60% at 50% 100%, rgba(168, 85, 247, 0.08) 0%, transparent 70%),
            radial-gradient(ellipse 80% 60% at 50% 0%, rgba(34, 211, 238, 0.06) 0%, transparent 70%);
        }
        .ecosystem-globe-scanlines {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: repeating-linear-gradient(
            to bottom,
            transparent 0px,
            transparent 2px,
            rgba(255, 255, 255, 0.01) 2px,
            rgba(255, 255, 255, 0.01) 3px
          );
        }
      `}</style>
    </div>
  );
}
