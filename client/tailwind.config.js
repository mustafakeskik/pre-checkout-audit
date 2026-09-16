/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a',
        },
        apple: {
          blue: '#0071e3',
          blueHover: '#0077ed',
          text: '#1d1d1f',
          secondary: '#6e6e73',
          tertiary: '#86868b',
          bg: '#f5f5f7',
          green: '#1d9a4e',
          orange: '#c77700',
          red: '#d70015',
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'SF Pro Text', 'Segoe UI', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
