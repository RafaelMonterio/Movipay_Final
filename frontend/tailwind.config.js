/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        client: { DEFAULT: '#FF7A00', light: '#FFF1E6', dark: '#E86D00' },
        worker: { DEFAULT: '#FF7A00', light: '#FFF1E6', dark: '#E86D00' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
