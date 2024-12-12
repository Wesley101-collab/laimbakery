// tailwind.config.js
module.exports = {
  darkMode: 'class',
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#121212',
          card: '#1E1E1E',
          text: '#E5E5E5',
          accent: '#FFB347'
        }
      }
    }
  },
  base: "/laimbakeryandpastry/",
  plugins: [],
}