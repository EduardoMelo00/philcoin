"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface MetricCardProps {
  label: string;
  children: ReactNode;
  subDetail?: string;
  className?: string;
  delay?: number;
  background?: string;
}

export default function MetricCard({
  label,
  children,
  subDetail,
  className = "",
  delay = 0,
  background,
}: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className={`analytics-card px-5 py-4 ${className}`}
      style={background ? { backgroundImage: background } : undefined}
    >
      <p className="text-[10px] text-text-tertiary uppercase tracking-wider font-medium mb-1">
        {label}
      </p>
      <div className="font-display">{children}</div>
      {subDetail && (
        <p className="text-xs text-text-secondary mt-1">{subDetail}</p>
      )}
    </motion.div>
  );
}
