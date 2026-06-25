import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const viewportFit = mode === 'capacitor' ? ', viewport-fit=cover' : '';

  return {
    plugins: [
      react(),
      {
        name: 'hapjusil-viewport-fit',
        transformIndexHtml(html) {
          return html.replace('%VIEWPORT_FIT%', viewportFit);
        },
      },
    ],
    server: {
      port: 5173,
      allowedHosts: ['.trycloudflare.com', '.ngrok-free.app', 'localhost'],
      proxy: {
        '/api': 'http://localhost:3000',
      },
    },
  };
});
