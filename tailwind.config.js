/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./**/*.{jsx,tsx}",
    "./components/**/*.{jsx,tsx}",
    "./App.tsx",
  ],
  theme: {
    extend: {
      fontFamily: {
        'russo': ['Russo One', 'sans-serif'],
        'pen': ['Nanum Pen Script', 'cursive'],
      },
    },
  },
  plugins: [],
}

