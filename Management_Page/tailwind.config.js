/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      width: {
        '68': '17rem',
        '56': '14rem',
      },
      margin: {
        '68': '17rem',
        '56': '14rem',
      },
    },
  },
  plugins: [],
}
