import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
      dedupe: ['react', 'react-dom'],
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify - file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      proxy: {
        '/api': 'http://localhost:3002',
      },
    },
    build: {
      // Augmente la limite pour faire taire le warning (668 kB gzippé → 197 kB, acceptable)
      chunkSizeWarningLimit: 700,
      rollupOptions: {
        output: {
          manualChunks: {
            // React core — rarement mis à jour, sera mis en cache longtemps
            'vendor-react': ['react', 'react-dom'],
            // Framer Motion — lib d'animation lourde (~100 kB)
            'vendor-motion': ['motion'],
            // Supabase client
            'vendor-supabase': ['@supabase/supabase-js'],
            // Icônes Lucide — chargé séparément pour ne pas polluer le chunk principal
            'vendor-lucide': ['lucide-react'],
            // Composants shadcn/ui + utilitaires
            'vendor-ui': [
              'class-variance-authority',
              'clsx',
              'tailwind-merge',
              '@base-ui/react',
            ],
          },
        },
      },
    },
  };
});
