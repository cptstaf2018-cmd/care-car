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
        // Legacy pages were written with Tailwind's cyan and near-black slate. Re-pointing those
        // shades here brings every older screen into the odometer palette without touching each file.
        cyan: {
          50: '#FEF6E7', 100: '#FCE7C4', 200: '#F9D08C', 300: '#F6BA5E', 400: '#F0A33A',
          500: '#E08F1F', 600: '#C9831F', 700: '#9A5F12', 800: '#72460D', 900: '#4A2E08', 950: '#2B1A04',
        },
        slate: { 900: '#0b2f31', 950: '#082628' },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans Arabic"', '"Segoe UI"', 'Tahoma', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
