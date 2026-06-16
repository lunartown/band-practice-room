import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    allowedHosts: ['.trycloudflare.com', '.ngrok-free.app', 'localhost'],
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
