const { colors } = require('./src/styles/themes')

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      animation: {
        'custom-pulse': 'custom-pulse 2s ease-in-out infinite',
        'soft-bounce': 'soft-bounce 1s ease-in-out infinite',
        'gentle-spin': 'gentle-spin 3s linear infinite',
        'fade-in-out': 'fade-in-out 2s ease-in-out infinite',
        'scale-pulse': 'scale-pulse 1.5s ease-in-out infinite',
        'wave': 'wave 2s ease-out infinite',
        'liquid-progress': 'liquid-progress 2s ease-in-out infinite',
        'breathe': 'breathe 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'typing-dots': 'typing-dots 1.4s ease-in-out infinite',
        'radar': 'radar 2s ease-out infinite',
        'gradient-shift': 'gradient-shift 3s ease infinite',
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        success: colors.success,
        warning: colors.warning,
        error: colors.error,
        gray: colors.gray,
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "collapsible-down": {
          from: { height: 0 },
          to: { height: 'var(--radix-collapsible-content-height)' },
        },
        "collapsible-up": {
          from: { height: 'var(--radix-collapsible-content-height)' },
          to: { height: 0 },
        },
        ripple: {
          "0%": {
            transform: "translate(-50%, -50%) scale(0.5)",
            opacity: "0.8",
          },
          "50%": {
            transform: "translate(-50%, -50%) scale(1.5)",
            opacity: "0.4",
          },
          "100%": {
            transform: "translate(-50%, -50%) scale(3)",
            opacity: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "collapsible-down": "collapsible-down 0.2s ease-out",
        "collapsible-up": "collapsible-up 0.2s ease-out",
        ripple: "ripple 3s ease-out infinite",
        grid: "grid 15s ease-in-out infinite",
        "meteor-effect": "meteor-effect linear infinite",
        "shine-pulse": "shine-pulse linear infinite",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/forms"),
    require("tailwind-scrollbar")({ nocompatible: true }),
  ],
}