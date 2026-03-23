import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  build: {
    rollupOptions: {
      output: {
        // Manual chunk splitting — keeps frequently-used vendor libs separate
        // from page-specific code so returning visitors get better cache hits.
        manualChunks(id) {
          // Framer Motion into its own vendor chunk
          if (id.includes('framer-motion')) return 'vendor-framer';

          // React ecosystem
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/react-router')
          ) return 'vendor-react';

          // Lenis smooth scroll
          if (id.includes('lenis')) return 'vendor-lenis';

          // React Icons
          if (id.includes('react-icons')) return 'vendor-icons';

          // Section chunks — each below-fold section lazy-loaded by Landing.jsx
          if (id.includes('sections/HowItWorks'))         return 's-howitworks';
          if (id.includes('sections/SignalTerminal'))      return 's-terminal';
          if (id.includes('sections/HorizontalShowcase'))  return 's-showcase';
          if (id.includes('sections/SocialProof'))         return 's-social';
          if (id.includes('sections/BigStatement'))        return 's-bigstatement';
          if (id.includes('sections/CTASection'))          return 's-cta';

          // BounceCards — also lazy inside HorizontalShowcase
          if (id.includes('components/BounceCards'))       return 'bounce-cards';
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
