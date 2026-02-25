import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  server: {
    proxy: {
      // All /api requests from the browser are forwarded to the backend
      // This means the browser sees them as same-origin → no CORS error ever
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      // Socket.io WebSocket upgrade
      '/socket.io': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        ws: true,           // ← proxies WebSocket connections too
        secure: false,
      },
    },
  },
})
