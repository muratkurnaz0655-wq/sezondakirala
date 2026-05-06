import type { Config } from "tailwindcss";

const config: Config = {
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#0d1117",
          dark: "#111827",
          teal: "#0e9aa7",
          cyan: "#22d3ee",
          silver: "#94a3b8",
          deepTeal: "#0f4c5c",
          patina: "#4a7c7e",
          light: "#e2e8f0",
        },
      },
    },
  },
};

export default config;
