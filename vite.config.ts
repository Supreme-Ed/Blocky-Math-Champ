import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import expressPlugin from './vite-express-plugin';

export default defineConfig({
  plugins: [
    react(),
    expressPlugin()
  ],
  root: '.',
  server: {
    open: true,
    proxy: {
      // Proxy API requests to the Express server
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      },
      // Proxy structure file requests to the Express server
      '/models/structures': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@game': path.resolve(__dirname, './src/game'),
      '@hooks': path.resolve(__dirname, './src/components/hooks'),
      '@types': path.resolve(__dirname, './src/types')
    }
  }
});
