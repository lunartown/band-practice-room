import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    allowedHosts: ['.trycloudflare.com', '.ngrok-free.app', 'localhost'],
    proxy: {
      // localhost가 IPv6(::1)로 해석되면 IPv4로만 떠 있는 로컬 API에 붙지 못한다.
      '/api': 'http://127.0.0.1:3000',
    },
  },
});
