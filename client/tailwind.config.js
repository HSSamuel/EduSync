/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Lato", "sans-serif"],
        serif: ['"Playfair Display"', "serif"], // 👈 Added our new premium heading font
      },
    },
  },
  plugins: [],
};
