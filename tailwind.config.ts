import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1360px",
      },
    },
    extend: {
      colors: {
        // Core Theme Tokens (adaptive to Dark / Light mode)
        navy: {
          950: "rgb(var(--navy-950) / <alpha-value>)", // Dark default background / Light crisp page bg
          900: "rgb(var(--navy-900) / <alpha-value>)", // Card / Container surface
          850: "rgb(var(--navy-850) / <alpha-value>)", // Elevated / Active state
          800: "rgb(var(--navy-800) / <alpha-value>)", // Subtle border
          700: "rgb(var(--navy-700) / <alpha-value>)", // Hover border
        },
        light: {
          bg: "#F5F7FF",
          surface: "#FFFFFF",
          elevated: "#F0F3FF",
          border: "#E2E8F0",
        },
        // Accent Colors
        cyan: {
          DEFAULT: "#22D3EE",
          400: "#22D3EE",
          500: "#06B6D4",
        },
        blue: {
          DEFAULT: "#3B82F6",
          500: "#3B82F6",
          600: "#2563EB",
        },
        violet: {
          DEFAULT: "#8B5CF6",
          500: "#8B5CF6",
          600: "#7C3AED",
        },
        success: {
          DEFAULT: "#34D399",
          500: "#34D399",
        },
        warning: {
          DEFAULT: "#FBBF24",
          500: "#FBBF24",
        },
        danger: {
          DEFAULT: "#F87171",
          500: "#F87171",
        },
        // Club Brands
        club: {
          nexcell: "#3B9BE0",
          malhar: "#E8A935",
          "malhar-bg": "#14275E",
          khel: "#1E6FC0",
          kaizendev: "#4FA39A",
          cp: "#A3E635",
          ki: "#D9A441",
        },
        // Semantic Token Mapping
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        heading: ["Space Grotesk", "Sora", "-apple-system", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, #22D3EE 0%, #3B82F6 50%, #8B5CF6 100%)",
        "gradient-glow": "radial-gradient(ellipse at top, rgba(34, 211, 238, 0.15), transparent 70%)",
        "glass-gradient": "linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)",
      },
      boxShadow: {
        glow: "0 0 20px -5px rgba(34, 211, 238, 0.35)",
        "glow-lg": "0 0 35px -5px rgba(59, 130, 246, 0.4)",
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
      },
    },
  },
  plugins: [],
};

export default config;
