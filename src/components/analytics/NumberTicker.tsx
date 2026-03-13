"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useMemo } from "react";

interface NumberTickerProps {
  value: string;
  className?: string;
}

export default function NumberTicker({ value, className = "" }: NumberTickerProps) {
  const digits = useMemo(() => value.split(""), [value]);

  return (
    <span className={`inline-flex ${className}`} aria-label={value}>
      <AnimatePresence mode="popLayout" initial={false}>
        {digits.map((digit, index) => (
          <motion.span
            key={`${index}-${digit}`}
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -12, opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 30,
              mass: 0.8,
            }}
            className="inline-block"
          >
            {digit}
          </motion.span>
        ))}
      </AnimatePresence>
    </span>
  );
}
