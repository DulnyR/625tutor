/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FFFFFF',  // White
        secondary: '#3B82F6',  // Light Blue
        gray: '#D1D5DB',  // Light Gray
        darkGray: '#374151',  // Dark Gray
        yellow: '#F59E0B',  // Soft Yellow
        green: '#10B981',  // Soft Green
        darkGray: '#374151',  // Dark Gray
      },
    },
  },
  plugins: [],
}
