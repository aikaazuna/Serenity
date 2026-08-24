/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          950: "#08090b",
          900: "#0d0e11",
          850: "#12141a",
          800: "#181a21",
          700: "#22242c",
          600: "#2c2f38",
          500: "#3a3d47",
        },
        line: {
          soft: "rgba(255,255,255,0.08)",
          strong: "rgba(255,255,255,0.14)",
        },
      },
      fontFamily: {
        sans: [
          "Space Grotesk",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI Variable",
          "Segoe UI",
          "system-ui",
          "Roboto",
          "Helvetica Neue",
          "sans-serif",
        ],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Consolas",
          "Menlo",
          "Liberation Mono",
          "Courier New",
          "monospace",
        ],
      },
      backdropBlur: {
        xs: "2px",
        premium: "24px",
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)",
        "glass-lg": "0 24px 64px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.07)",
        glow: "0 0 0 1px rgba(255,255,255,0.08), 0 8px 24px rgba(0,0,0,0.4)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.2s ease-out",
        shimmer: "shimmer 2.5s linear infinite",
      },
    },
  },
  plugins: [],
};
