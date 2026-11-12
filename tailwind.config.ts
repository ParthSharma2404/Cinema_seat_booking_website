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
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Outfit"', '"Plus Jakarta Sans"', 'sans-serif'],
        cinematic: ['"Cinzel"', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'Menlo', 'monospace'],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        gold: {
          50: "#faf7ee",
          100: "#f3ebd6",
          200: "#e7d6ad",
          300: "#d9bc7d",
          400: "#cca255",
          500: "#d4af37",
          600: "#b68c28",
          700: "#916922",
          800: "#775421",
          900: "#65451f",
        },
        minimal: {
          50: "#fafbfc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
        },
        violet: {
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
        },
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025)',
        'float': '0 20px 35px -8px rgba(15, 23, 42, 0.08), 0 1px 3px 0 rgba(0, 0, 0, 0.02)',
        'glow-violet': '0 4px 20px -2px rgba(124, 58, 237, 0.25)',
        'glow-gold': '0 4px 25px -2px rgba(212, 175, 55, 0.35)',
      },
    },
  },
  plugins: [],
};
export default config;
