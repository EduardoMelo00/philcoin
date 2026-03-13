"use client";

import { motion } from "framer-motion";
import type { RiskData } from "@/types/analytics";

interface RiskAssessmentProps {
  data: RiskData;
}

function RiskGauge({ score, level }: { score: number; level: string }) {
  const normalizedAngle = (score / 100) * 180;
  const gaugeRadius = 80;
  const strokeWidth = 12;
  const centerX = 100;
  const centerY = 90;

  function describeArc(startAngle: number, endAngle: number) {
    const startRad = ((180 + startAngle) * Math.PI) / 180;
    const endRad = ((180 + endAngle) * Math.PI) / 180;
    const x1 = centerX + gaugeRadius * Math.cos(startRad);
    const y1 = centerY + gaugeRadius * Math.sin(startRad);
    const x2 = centerX + gaugeRadius * Math.cos(endRad);
    const y2 = centerY + gaugeRadius * Math.sin(endRad);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${gaugeRadius} ${gaugeRadius} 0 ${largeArc} 1 ${x2} ${y2}`;
  }

  const needleRad = ((180 + normalizedAngle) * Math.PI) / 180;
  const needleLength = gaugeRadius - 20;
  const needleX = centerX + needleLength * Math.cos(needleRad);
  const needleY = centerY + needleLength * Math.sin(needleRad);

  const scoreColor = score >= 80 ? "#22C55E" : score >= 60 ? "#22C55E" : score >= 40 ? "#F59E0B" : "#EF4444";

  return (
    <div className="flex flex-col items-center">
      <svg width="200" height="110" viewBox="0 0 200 110" role="meter" aria-valuenow={score} aria-valuemin={0} aria-valuemax={100}>
        <path d={describeArc(0, 180)} fill="none" stroke="var(--bg-elevated)" strokeWidth={strokeWidth} strokeLinecap="round" />
        <path d={describeArc(0, 72)} fill="none" stroke="#EF4444" strokeWidth={strokeWidth} strokeLinecap="round" opacity={0.3} />
        <path d={describeArc(72, 108)} fill="none" stroke="#F59E0B" strokeWidth={strokeWidth} strokeLinecap="round" opacity={0.3} />
        <path d={describeArc(108, 144)} fill="none" stroke="#22C55E" strokeWidth={strokeWidth} strokeLinecap="round" opacity={0.3} />
        <path d={describeArc(144, 180)} fill="none" stroke="#22C55E" strokeWidth={strokeWidth} strokeLinecap="round" opacity={0.5} />

        <motion.path
          d={describeArc(0, normalizedAngle)}
          fill="none"
          stroke={scoreColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />

        <motion.line
          x1={centerX}
          y1={centerY}
          x2={needleX}
          y2={needleY}
          stroke={scoreColor}
          strokeWidth={2.5}
          strokeLinecap="round"
          initial={{ x2: centerX - needleLength, y2: centerY }}
          animate={{ x2: needleX, y2: needleY }}
          transition={{ duration: 0.8, type: "spring", stiffness: 60, damping: 12 }}
        />
        <circle cx={centerX} cy={centerY} r={4} fill={scoreColor} />
      </svg>
      <div className="text-center -mt-2">
        <span className="text-3xl font-bold font-mono" style={{ color: scoreColor }}>{score}</span>
        <p className="text-xs text-text-secondary mt-0.5">{level} Risk</p>
      </div>
    </div>
  );
}

function RiskFactorCard({ name, score, maxScore, description }: {
  name: string;
  score: number;
  maxScore: number;
  description: string;
}) {
  const ratio = score / maxScore;
  const color = ratio >= 0.8 ? "#22C55E" : ratio >= 0.6 ? "#22C55E" : ratio >= 0.4 ? "#F59E0B" : "#EF4444";

  return (
    <div className="flex items-center gap-3 py-2">
      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm text-text-secondary">{name}</span>
          <span className="text-sm font-mono font-medium text-text-primary">{score}/{maxScore}</span>
        </div>
        <div className="h-1.5 rounded-full bg-elevated overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${ratio * 100}%` }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="h-full rounded-full"
            style={{ backgroundColor: color }}
          />
        </div>
        <p className="text-[10px] text-text-tertiary mt-1">{description}</p>
      </div>
    </div>
  );
}

export default function RiskAssessment({ data }: RiskAssessmentProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 1.0 }}
      className="analytics-card p-4 md:p-6"
    >
      <h2 className="text-xl font-semibold text-text-primary mb-4">Risk Assessment</h2>

      <RiskGauge score={data.overallScore} level={data.level} />

      <div className="mt-6 space-y-1 divide-y divide-[var(--border-subtle)]">
        {data.factors.map((factor) => (
          <RiskFactorCard
            key={factor.name}
            name={factor.name}
            score={factor.score}
            maxScore={factor.maxScore}
            description={factor.description}
          />
        ))}
      </div>
    </motion.div>
  );
}
