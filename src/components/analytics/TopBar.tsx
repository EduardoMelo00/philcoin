"use client";

import PhilLogo from "./PhilLogo";
import { getTimeAgo } from "@/lib/formatters";

interface TopBarProps {
  secondsAgo: number;
  isLive: boolean;
}

export default function TopBar({ secondsAgo, isLive }: TopBarProps) {
  const stale = secondsAgo > 60;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 border-b backdrop-blur-xl" style={{
      backgroundColor: "var(--bg-glass)",
      borderColor: "var(--border-subtle)",
    }}>
      <div className="max-w-[1440px] mx-auto h-full px-4 md:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <PhilLogo size={28} />
          <span className="hidden md:inline text-text-primary font-semibold text-base tracking-tight font-display">
            PHILCOIN Analytics
          </span>
          <div className="hidden md:block w-px h-5 bg-text-muted/20" />
          <div className="hidden md:flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-purple-500" />
            <span className="text-xs text-text-tertiary font-medium">Polygon</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isLive ? "bg-accent-bullish animate-pulse-live" : "bg-accent-warning"}`} />
            <span className={`text-[10px] uppercase tracking-[0.1em] font-medium ${isLive ? "text-accent-bullish" : "text-accent-warning"}`}>
              {isLive ? "LIVE" : "STALE"}
            </span>
          </div>
          <span className={`text-xs font-mono ${stale ? "text-accent-warning" : "text-text-tertiary"}`}>
            {secondsAgo === 0 ? "Just now" : getTimeAgo(secondsAgo)}
          </span>
        </div>
      </div>
    </header>
  );
}
