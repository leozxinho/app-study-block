import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // PostCSS aqui (sem postcss.config.js na raiz): Tailwind + prefixos de navegador
  css: {
    postcss: {
      plugins: [tailwindcss(), autoprefixer()],
    },
  },
})
