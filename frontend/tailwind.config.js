/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Palette inspired by the reference stylesheet (--first-color / --second-color)
        brand: {
          DEFAULT: "hsl(224, 89%, 60%)",
          dark: "hsl(224, 56%, 12%)",
          50: "#eef3ff",
          100: "#dce7ff",
          500: "hsl(224, 89%, 60%)",
          600: "hsl(224, 80%, 52%)",
          700: "hsl(224, 70%, 44%)",
        },
      },
      fontFamily: {
        sans: ["Poppins", "sans-serif"],
        serif: ["Playfair Display", "serif"],
        script: ["Great Vibes", "cursive"],
      },
      boxShadow: {
        card: "0px 4px 25px rgba(14, 36, 49, 0.10)",
      },
    },
  },
  plugins: [],
};
