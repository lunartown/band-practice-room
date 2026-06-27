import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const DEFAULT_DEV_API_PROXY_TARGET = 'https://hapjusil-api.onrender.com';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiProxyTarget = env.VITE_DEV_API_PROXY_TARGET || DEFAULT_DEV_API_PROXY_TARGET;

  return {
    plugins: [react()],
    server: {
      port: 5173,
      allowedHosts: ['.trycloudflare.com', '.ngrok-free.app', 'localhost'],
      proxy: {
        // 폰에서 로컬 웹을 볼 때도 /api는 같은 Vite origin으로 요청되고,
        // Vite가 실 API(Render)로 넘겨 CORS를 피한다.
        // 로컬 API를 확인해야 할 때만 VITE_DEV_API_PROXY_TARGET=http://127.0.0.1:3000 으로 덮어쓴다.
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
