/* eslint-disable @typescript-eslint/no-explicit-any */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import visualizer from 'rollup-plugin-visualizer';
import { compression } from 'vite-plugin-compression2';
import { defineConfig } from 'vitest/config';

const currentDir = path.dirname(fileURLToPath(import.meta.url));

const getPlugins = (mode: string): any[] => {
  const plugins: any[] = [
    react(),
    tailwindcss(),
    compression({ algorithms: ['gzip'] }),
    compression({ algorithms: ['brotliCompress'] }),
  ];
  if (mode === 'analyze') {
    plugins.push(
      visualizer({
        open: true,
        filename: 'dist/stats.html',
        gzipSize: true,
        brotliSize: true,
      }),
    );
  }
  return plugins;
};

export default defineConfig(({ mode }) => ({
  plugins: getPlugins(mode),
  resolve: {
    alias: {
      '@': path.resolve(currentDir, './src'),
    },
  },
  build: {
    target: 'es2022',
    minify: 'esbuild',
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          // Vendor code splitting
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react';
            }

            if (id.includes('@tanstack') || id.includes('zustand') || id.includes('axios')) {
              return 'vendor-data';
            }

            if (id.includes('recharts')) {
              return 'vendor-charts';
            }

            if (id.includes('socket.io')) {
              return 'vendor-websocket';
            }

            // Group remaining vendor modules by size
            if (id.includes('node_modules')) {
              return 'vendor-misc';
            }
          }

          // Feature-based code splitting for application code
          if (id.includes('/src/features/')) {
            const featureMatch = id.match(/\/src\/features\/([^/]+)/);
            if (featureMatch) {
              return `feature-${featureMatch[1]}`;
            }
          }

          return undefined;
        },
      },
    },
    reportCompressedSize: true,
    chunkSizeWarningLimit: 1000,
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'zustand',
      'recharts',
    ],
    exclude: ['@tanstack/react-virtual'],
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    globals: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        'src/test-utils.ts',
        'src/test-setup.ts',
      ],
    },
  },
}));
