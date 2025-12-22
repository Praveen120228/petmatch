import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/petmat/', // Ensure this matches your repository name for GitHub Pages or similar
  build: {
    target: 'es2020',
  },
})
