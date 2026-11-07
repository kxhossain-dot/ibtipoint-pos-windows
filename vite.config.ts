import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  // Relative asset paths: required for Electron (file://) and works for Capacitor / static hosting.
  base: './',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(rootDir, '.'),
    },
  },
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 800,
    sourcemap: false,
    // Inline the bundled seed spreadsheet as a data: URL so it loads under file:// (Electron) too
    assetsInlineLimit: 2_000_000,
  },
});
