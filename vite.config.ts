import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),
  ],
  envPrefix: ['VITE_'],
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        // Remove todos os console.* do código de produção
        drop_console: true,
        // Opcional: remove também os 'debugger'
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // Separar React e React DOM em chunk próprio
          'react-vendor': ['react', 'react-dom'],
          // Separar Radix UI components
          'radix-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
            '@radix-ui/react-popover',
            '@radix-ui/react-accordion',
            '@radix-ui/react-navigation-menu'
          ],
          // Separar outras bibliotecas grandes
          'utils-vendor': [
            'axios',
            'date-fns',
            'zod',
            'zustand',
            '@tanstack/react-query'
          ],
          // Separar componentes de UI
          'ui-vendor': [
            'lucide-react',
            'recharts',
            'embla-carousel-react',
            'react-hook-form',
            '@hookform/resolvers'
          ]
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  server: {
    port: 5173,
    strictPort: true,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3003',
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      }
    }
  },
  preview: {
    port: 4173,
    strictPort: true,
    host: true
  }
});
