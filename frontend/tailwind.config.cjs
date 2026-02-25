/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#0ea5e9",   // cyan
          purple:  "#8b5cf6",   // purple
        },
        dark: {
          900: "#080a0f",
          800: "#0d0f14",
          700: "#111318",
          600: "#1a1d26",
          500: "#2a2d38",
        },
      },
      fontFamily: {
        sans: ["DM Sans", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};