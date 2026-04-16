import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  build: {
    rollupOptions: {
      output: {
        // Manual chunk splitting — keeps frequently-used vendor libs separate
        // from page-specific code so returning visitors get better cache hits.
        manualChunks(id) {
          // Framer Motion into its own vendor chunk
          if (id.includes('framer-motion')) return 'vendor-framer';

          // MUI and emotion styling runtime
          if (id.includes('node_modules/@mui/') || id.includes('node_modules/@emotion/')) {
            return 'vendor-mui';
          }

          // React ecosystem
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/react-router')
          ) return 'vendor-react';

          // Firebase SDK
          if (id.includes('node_modules/firebase/')) return 'vendor-firebase';

          // Charting stack
          if (id.includes('node_modules/recharts/')) return 'vendor-recharts';
          if (
            id.includes('node_modules/highcharts/') ||
            id.includes('node_modules/highcharts-react-official/')
          ) {
            return 'vendor-highcharts';
          }
          if (id.includes('node_modules/lightweight-charts/')) return 'vendor-lightweight';

          // Lenis smooth scroll
          if (id.includes('lenis')) return 'vendor-lenis';

          // Lottie animation runtime
          if (id.includes('lottie-react') || id.includes('lottie-web')) return 'vendor-lottie';

          // React Icons
          if (id.includes('react-icons')) return 'vendor-icons';

          // Section chunks — each below-fold section lazy-loaded by Landing.jsx
          if (id.includes('sections/SignalTerminal'))      return 's-terminal';
          if (id.includes('sections/HorizontalShowcase'))  return 's-showcase';
          if (id.includes('sections/SocialProof'))         return 's-social';
          if (id.includes('sections/BigStatement'))        return 's-bigstatement';
          if (id.includes('sections/CTASection'))          return 's-cta';
        },
      },
    },
  },

  server: {
    proxy: {
      '/health':      'http://localhost:8000',
      '/predict':     'http://localhost:8000',
      '/chart':       'http://localhost:8000',
      '/portfolio':   'http://localhost:8000',
      '/news':        'http://localhost:8000',
      '/fundamentals':'http://localhost:8000',
    },
  },
})
