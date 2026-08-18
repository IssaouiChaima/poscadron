/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        industrial: {
          950: "#0b4d8c",
          900: "#0c5aa6",
          800: "#1768b8",
          700: "#2d7dd2",
        },
        safety: {
          500: "#e0f2fe",
          600: "#bae6fd",
        },
        status: {
          available: "#16a34a",
          service: "#2563eb",
          maintenance: "#f59e0b",
          out: "#dc2626",
        },
      },
    },
  },
  plugins: [],
}
