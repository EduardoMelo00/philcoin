"use client";

interface SkeletonBarProps {
  width?: string;
  height?: string;
  className?: string;
}

export function SkeletonBar({ width = "100%", height = "16px", className = "" }: SkeletonBarProps) {
  return (
    <div
      className={`animate-pulse rounded bg-elevated ${className}`}
      style={{ width, height }}
    />
  );
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`analytics-card p-5 space-y-3 ${className}`}>
      <SkeletonBar width="60%" height="10px" />
      <SkeletonBar width="80%" height="28px" />
      <SkeletonBar width="40%" height="10px" />
    </div>
  );
}

export function SkeletonChart({ className = "" }: { className?: string }) {
  return (
    <div className={`analytics-card p-6 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <SkeletonBar width="120px" height="20px" />
        <div className="flex gap-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonBar key={i} width="36px" height="28px" />
          ))}
        </div>
      </div>
      <SkeletonBar width="100%" height="360px" />
    </div>
  );
}
