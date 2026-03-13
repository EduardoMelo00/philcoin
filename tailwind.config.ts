import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        void: "#06080F",
        surface: "#0B0E18",
        elevated: "#111527",
        overlay: "#161A2D",
        "accent-primary": "#3B82F6",
        "accent-bullish": "#22C55E",
        "accent-bearish": "#EF4444",
        "accent-warning": "#F59E0B",
        "accent-info": "#6366F1",
        "accent-phil": "#F58600",
        "text-primary": "#F1F5F9",
        "text-secondary": "#94A3B8",
        "text-tertiary": "#64748B",
        "text-muted": "#475569",
      },
      fontFamily: {
        display: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
      },
      animation: {
        "pulse-live": "pulse-live 1.5s ease-in-out infinite",
      },
      keyframes: {
        "pulse-live": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
