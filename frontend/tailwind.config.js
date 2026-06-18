/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Manrope", "Inter", "ui-sans-serif", "system-ui"]
      },
      colors: {
        ink: "#050914",
        panel: "#0b1220",
        cyan: "#44d7e8",
        electric: "#4d7cff",
        violet: "#9668ff",
        mint: "#49dfa8"
      },
      boxShadow: {
        glow: "0 0 40px rgba(77,124,255,.16)",
        panel: "0 24px 80px rgba(0,0,0,.28)"
      }
    }
  },
  plugins: []
};
