import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        arc: {
          blue: "#3139fb",
          cream: "#fffcec",
          yellow: "#fffadd",
          white: "#ffffff",
          muted: "rgba(49, 57, 251, 0.65)",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      borderRadius: {
        "arc-sm": "4px",
        "arc-md": "8px",
        "arc-lg": "10px",
        "arc-xl": "22px",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        "arc-card": "rgba(0, 0, 0, 0.1) 0px 5px 5px 0px",
        "arc-elevated": "rgba(49, 57, 251, 0.16) 0px 8px 24px -4px, rgba(0, 0, 0, 0.08) 0px 2px 8px 0px",
      },
      fontFamily: {
        display: ["var(--font-display)", "Marlin Soft SQ", "-apple-system", "sans-serif"],
        heading: ["var(--font-heading)", "Exposure VAR", "Helvetica", "sans-serif"],
        body: ["var(--font-body)", "InterVariable", "Inter", "sans-serif"],
        mono: ["var(--font-mono)", "ABC Favorit Mono", "monospace"],
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;


