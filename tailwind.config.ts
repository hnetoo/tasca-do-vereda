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
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
      },
      boxShadow: {
        glow: "0 0 30px hsl(var(--primary) / 0.35)",
        "glow-yellow": "0 0 30px rgb(234 179 8 / 0.5)",
        "glow-emerald": "0 0 30px rgb(16 185 129 / 0.45)",
      },
    },
  },
  plugins: [],
};
export default config;
