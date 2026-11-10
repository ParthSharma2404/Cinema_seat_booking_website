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
        background: "var(--background)",
        foreground: "var(--foreground)",
        cinema: {
          dark: "#0b0f19",
          card: "#121826",
          border: "#1f293d",
          accent: "#e50914",
          gold: "#f59e0b",
          silver: "#94a3b8",
          recliner: "#8b5cf6",
        },
      },
    },
  },
  plugins: [],
};
export default config;
