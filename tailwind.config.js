/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta do StudyBlock. Papéis: principal = green, destaque/recompensa = gold (sempre com texto escuro),
        // sucesso = emerald, erro = redstone, informação/foco = lapis, fundo = sky.
        brand: {
          green: '#4E8A3A',
          'dark-green': '#2F5E22',
          brown: '#8B6914',
          'dark-brown': '#5C4A0E',
          stone: '#7A7F87',
          'dark-stone': '#474C54',
          dirt: '#9B7653',
          wood: '#BC9862',
          sky: '#8ED1F5',
          'dark-sky': '#1A1A3E',
          gold: '#FFC83D',
          diamond: '#3DD6C6',
          redstone: '#E5484D',
          emerald: '#2FBF71',
          lapis: '#2F6FDB',
          iron: '#D8D8D8',
          coal: '#2C2C2C',
          bedrock: '#353535',
          water: '#3F76E4',
          lava: '#CF4401',
          ink: '#10263F',
        },
      },
      fontFamily: {
        minecraft: ['"Press Start 2P"', 'monospace'],
        body: ['Nunito', 'sans-serif'],
      },
      animation: {
        'bounce-slow': 'bounce 2s infinite',
        'pulse-slow': 'pulse 3s infinite',
        'float': 'float 3s ease-in-out infinite',
        'shake': 'shake 0.5s ease-in-out',
        'sparkle': 'sparkle 1.5s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' },
        },
        sparkle: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(1.2)' },
        },
      },
    },
  },
  plugins: [],
}
