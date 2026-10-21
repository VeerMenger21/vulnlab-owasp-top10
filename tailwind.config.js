/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        lab: {
          950: '#06090e',
          900: '#0b0f17',
          850: '#101622',
          800: '#161f30',
          700: '#1f2b42',
          600: '#2d3d5c',
          500: '#43577d',
        },
        vuln: {
          critical: '#ef4444',
          high: '#f97316',
          medium: '#eab308',
          low: '#3b82f6',
          info: '#64748b',
        },
        cyber: {
          cyan: '#06b6d4',
          blue: '#0284c7',
          teal: '#14b8a6',
          emerald: '#10b981',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      }
    },
  },
  plugins: [],
}
