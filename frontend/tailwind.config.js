export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      // "Odometer" design direction: petrol dashboard, oil-amber accents.
      colors: {
        petrol: { DEFAULT: '#0D3B3E', deep: '#082628', line: '#1D5A5E', soft: '#2C6D70' },
        oil: { DEFAULT: '#F0A33A', dark: '#C9831F', light: '#FCE7C4' },
        mint: { DEFAULT: '#E8F1EF', dim: '#CFDEDB', ink: '#3F5F5D' },
        gauge: { DEFAULT: '#6E8C8A', light: '#A9C2BF' },
        alert: '#E5533D',
      },
      fontFamily: {
        sans: ['"IBM Plex Sans Arabic"', '"Segoe UI"', 'Tahoma', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
