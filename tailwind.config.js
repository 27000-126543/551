/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        navy: {
          900: '#0A1929',
          800: '#0F2B46',
          700: '#15365C',
          600: '#1B4272',
          500: '#214E88',
        },
        cyber: {
          500: '#00D4AA',
          400: '#33DDBB',
          300: '#66E6CC',
          600: '#00B892',
        },
        alert: {
          red: '#FF4D4F',
          orange: '#FAAD14',
          green: '#52C41A',
        },
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', 'sans-serif'],
        mono: ['"DIN Pro"', '"Roboto Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
