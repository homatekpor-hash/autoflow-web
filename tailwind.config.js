/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      colors: {
        brand: {
          50:  "#eef4ff",
          100: "#dce9ff",
          200: "#b2cfff",
          400: "#5b96f7",
          600: "#2563eb",
          800: "#1e3a8a",
          900: "#172554",
        },
        ink: {
          DEFAULT: "#0f1117",
          soft:    "#1e2130",
          muted:   "#374151",
          subtle:  "#6b7280",
          faint:   "#9ca3af",
          ghost:   "#e5e7eb",
          paper:   "#f9fafb",
        },
        status: {
          intake:   { bg: "#f3f4f6", text: "#374151", border: "#d1d5db" },
          diagnosing: { bg: "#fefce8", text: "#854d0e", border: "#fde68a" },
          progress: { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" },
          quality:  { bg: "#f0fdf4", text: "#166534", border: "#bbf7d0" },
          complete: { bg: "#f0fdf4", text: "#15803d", border: "#86efac" },
        },
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        lift: "0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
    },
  },
  plugins: [],
};
