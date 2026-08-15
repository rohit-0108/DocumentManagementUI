import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      strictPort: true,
      open: true,
      proxy: {
        '/api': {
          target: env.VITE_API_PROXY_TARGET || 'https://localhost:7275',
          changeOrigin: true,
          secure: false, // self-signed dev certificate
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: mode !== 'production',
      chunkSizeWarningLimit: 1200,
    },
  };
});