import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ["'IBM Plex Mono'", "monospace"],
        display: ["'Syne'", "sans-serif"],
        body: ["'DM Sans'", "sans-serif"],
      },
      colors: {
        bg: "#080c10",
        surface: "#0d1117",
        card: "#111820",
        border: "#1e2a35",
        accent: "#00e5ff",
        green: "#00ff88",
        red: "#ff3b5c",
        gold: "#ffd700",
        muted: "#4a6070",
        text: "#c8d8e4",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "ticker": "ticker 30s linear infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
        "fade-in": "fadeIn 0.5s ease forwards",
        "slide-up": "slideUp 0.4s ease forwards",
      },
      keyframes: {
        ticker: {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(-100%)" },
        },
        glow: {
          "0%": { boxShadow: "0 0 5px #00e5ff33" },
          "100%": { boxShadow: "0 0 20px #00e5ff66, 0 0 40px #00e5ff22" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
