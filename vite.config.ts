import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        // Rolldown (Vite 8) requires manualChunks to be a function. Keeping the
        // heavy, rarely-changing libraries in their own chunks makes app
        // updates invalidate far less of the browser cache.
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('recharts') || id.includes('/d3-') || id.includes('victory-vendor')) {
            return 'charts';
          }
          if (id.includes('lucide-react')) return 'icons';
          if (id.includes('date-fns')) return 'dates';
          if (id.includes('react-router')) return 'router';
          if (
            id.includes('/react/') ||
            id.includes('/react-dom/') ||
            id.includes('/scheduler/') ||
            id.includes('jsx-runtime')
          ) {
            return 'react';
          }
        },
      },
    },
  },
  server: {
    port: 5173,
    open: false,
  },
});
