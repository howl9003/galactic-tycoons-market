import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Both /api and /db go through our Express server
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: false,
      },
      '/db': {
        target: 'http://localhost:3001',
        changeOrigin: false,
      },
    },
  },
})
