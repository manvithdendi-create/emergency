/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        emergency: {
          red: '#DC2626',
          'red-light': '#FEF2F2',
          'red-dark': '#991B1B',
          amber: '#F59E0B',
          'amber-light': '#FFFBEB',
          'amber-dark': '#92400E',
          blue: '#2563EB',
          'blue-light': '#EFF6FF',
          'blue-dark': '#1E40AF',
          green: '#16A34A',
          'green-light': '#F0FDF4',
          'green-dark': '#166534',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}