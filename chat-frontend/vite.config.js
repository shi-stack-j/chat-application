import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(),],
  define: {
    global: 'globalThis'
  },
  server: {
    proxy: {
      '/chat-app/v1': {
        target: 'http://localhost:8080',
        changeOrigin: true
        // configure: (proxy, options) => {
        //   proxy.on('proxyReq', (proxyReq, req, res) => {
        //     if (req.url.includes('/messages/get/latestMessages') && req.method === 'POST') {
        //       proxyReq.method = 'GET';
        //       // Node.js http request handles the body for GET implicitly when proxying
        //     }
        //   });
        // }
      }
    }
  }
})
