/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./**/*.{jsx,tsx}",
    "./components/**/*.{jsx,tsx}",
    "./App.tsx",
    "./types.ts",
  ],
  safelist: [
    // Category colors for blocks
    'bg-red-100', 'text-red-800', 'border-red-200',
    'bg-stone-100', 'text-stone-800', 'border-stone-200',
    'bg-emerald-100', 'text-emerald-800', 'border-emerald-200',
    'bg-yellow-100', 'text-yellow-800', 'border-yellow-200',
    'bg-gray-100', 'text-gray-800', 'border-gray-200',
    // Pastel colors for tracker cells
    'bg-red-200', 'bg-orange-200', 'bg-amber-200',
    'bg-yellow-200', 'bg-lime-200', 'bg-green-200',
    'bg-emerald-200', 'bg-teal-200', 'bg-cyan-200',
    'bg-sky-200', 'bg-blue-200', 'bg-indigo-200',
    'bg-violet-200', 'bg-purple-200', 'bg-fuchsia-200',
    'bg-pink-200', 'bg-rose-200',
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

