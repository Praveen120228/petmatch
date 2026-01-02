import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Use relative base path for maximum compatibility
  build: {
    target: 'es2020',
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['@phosphor-icons/react', 'framer-motion'],
          'vendor-utils': ['@supabase/supabase-js', 'date-fns', 'uuid'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
})
