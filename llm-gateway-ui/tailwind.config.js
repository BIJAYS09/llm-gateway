/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#0d0f12",
          1: "#12151a",
          2: "#181c23",
          3: "#1e232c",
          4: "#252b36",
        },
        amber: {
          DEFAULT: "#f59e0b",
          dim: "#b45309",
          glow: "#fbbf24",
          muted: "#78350f",
        },
        jade: { DEFAULT: "#10b981", dim: "#065f46" },
        rose: { DEFAULT: "#f43f5e", dim: "#881337" },
        sky: { DEFAULT: "#38bdf8", dim: "#0c4a6e" },
        ink: {
          DEFAULT: "#94a3b8",
          muted: "#475569",
          faint: "#1e2a3a",
        },
      },
      fontFamily: {
        display: ["Syne", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
        body: ["DM Sans", "sans-serif"],
      },
      backgroundImage: {
        "grid-faint":
          "linear-gradient(rgba(148,163,184,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.03) 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "40px 40px",
      },
      boxShadow: {
        amber: "0 0 20px rgba(245,158,11,0.15)",
        "amber-sm": "0 0 8px rgba(245,158,11,0.2)",
        jade: "0 0 20px rgba(16,185,129,0.15)",
        panel: "0 1px 0 rgba(148,163,184,0.06), inset 0 1px 0 rgba(148,163,184,0.04)",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease forwards",
        "slide-up": "slideUp 0.4s ease forwards",
        pulse2: "pulse2 2s ease-in-out infinite",
        flicker: "flicker 3s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: {
          from: { opacity: 0, transform: "translateY(12px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
        pulse2: {
          "0%,100%": { opacity: 1 },
          "50%": { opacity: 0.5 },
        },
        flicker: {
          "0%,100%": { opacity: 1 },
          "92%": { opacity: 1 },
          "93%": { opacity: 0.7 },
          "94%": { opacity: 1 },
        },
      },
    },
  },
  plugins: [],
};
