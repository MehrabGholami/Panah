import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    // Allow requests proxied through nginx (Docker) without Host-check 403
    allowedHosts: true,
    fs: {
      // Note: when fs.allow is set, Vite becomes strict and stops serving files outside allow list.
      // We must include the app root (/app in Docker), otherwise '/' returns 403.
      allow: ['/app', path.resolve(__dirname)],
    },
    // Windows + Docker volume mounts may miss file events; poll for changes
    watch: {
      usePolling: true,
      interval: 1000,
    },
    // In development only: proxy /api to local backend (Docker or localhost)
    ...(mode === 'development' && {
      proxy: {
        '/api': {
          target: process.env.VITE_PROXY_TARGET || 'http://localhost:8000',
          changeOrigin: true,
        },
      },
    }),
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Improve chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          mui: ['@mui/material', '@mui/icons-material'],
          charts: ['recharts'],
          maps: ['leaflet', 'react-leaflet'],
        },
      },
    },
  },
}));
