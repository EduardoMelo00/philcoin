"use client";

import { motion } from "framer-motion";
import type { Recommendation, RecommendationPriority } from "@/types/analytics";

interface RecommendationsProps {
  recommendations: Recommendation[];
}

const PRIORITY_STYLES: Record<RecommendationPriority, {
  border: string;
  badge: string;
  badgeText: string;
}> = {
  HIGH: {
    border: "border-l-red-500",
    badge: "bg-red-500/10 text-red-400",
    badgeText: "HIGH",
  },
  MEDIUM: {
    border: "border-l-amber-500",
    badge: "bg-amber-500/10 text-amber-400",
    badgeText: "MEDIUM",
  },
  LOW: {
    border: "border-l-blue-500",
    badge: "bg-blue-500/10 text-blue-400",
    badgeText: "LOW",
  },
};

export default function Recommendations({ recommendations }: RecommendationsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 1.2 }}
    >
      <h2 className="text-xl font-semibold text-text-primary mb-4">Strategic Recommendations</h2>

      <div className="space-y-3">
        {recommendations.map((rec, index) => {
          const style = PRIORITY_STYLES[rec.priority];
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 1.2 + index * 0.1 }}
              className={`analytics-card border-l-[3px] ${style.border} p-4 md:p-5`}
            >
              <div className="flex items-start gap-3">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${style.badge} uppercase tracking-wider flex-shrink-0 mt-0.5`}>
                  {style.badgeText}
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-text-primary leading-snug">
                    {rec.title}
                  </h3>
                  <p className="text-sm text-text-secondary mt-1 line-clamp-2">
                    {rec.description}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs font-mono text-text-tertiary">{rec.currentMetric}</span>
                    <span className="text-text-muted">→</span>
                    <span className="text-xs font-mono text-text-tertiary">{rec.targetMetric}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
