import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/auth': {
        target: 'https://elaichi.up.railway.app',
        changeOrigin: true,
        secure: false,
      },
      '/fetch': {
        target: 'https://elaichi.up.railway.app',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
