/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#C41E3A',      // Rojo CR
        secondary: '#0066CC',     // Azul CR
        accent: '#FFD700',        // Amarillo dorado
        success: '#009B3A',       // Verde
        'bg-dark': '#1a1a2e',
        'bg-light': '#f8f9fa',
      },
      fontFamily: {
        display: ['Bebas Neue', 'sans-serif'],
        body: ['Poppins', 'sans-serif'],
      },
      animation: {
        'bounce-ball': 'bounce 0.6s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
