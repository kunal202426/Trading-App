import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/health': 'http://localhost:8000',
      '/predict': 'http://localhost:8000',
      '/chart': 'http://localhost:8000',
      '/portfolio': 'http://localhost:8000',
      '/news': 'http://localhost:8000',
      '/fundamentals': 'http://localhost:8000',
    },
  },
})
