/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        minecraft: {
          green: '#5D8C3E',
          'dark-green': '#3B5E28',
          brown: '#8B6914',
          'dark-brown': '#5C4A0E',
          stone: '#7F7F7F',
          'dark-stone': '#4A4A4A',
          dirt: '#9B7653',
          wood: '#BC9862',
          sky: '#87CEEB',
          'dark-sky': '#1A1A3E',
          gold: '#FFD700',
          diamond: '#4AEDD9',
          redstone: '#FF0000',
          emerald: '#17DD62',
          lapis: '#345EC3',
          iron: '#D8D8D8',
          coal: '#2C2C2C',
          bedrock: '#353535',
          water: '#3F76E4',
          lava: '#CF4401',
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
