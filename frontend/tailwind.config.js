/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cinema: {
          dark: '#0f172a',
          card: '#1e293b',
          border: '#334155',
          accent: '#6366f1',
          gold: '#eab308'
        }
      }
    },
  },
  plugins: [],
}
