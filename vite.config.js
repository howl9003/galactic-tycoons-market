import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Browser fetches GT API directly through Vite (no server involvement)
      '/api': {
        target: 'https://api.g2.galactictycoons.com',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, ''),
        secure: true,
      },
      // DB reads/writes go to local Express server (localhost only, no outbound)
      '/db': {
        target: 'http://localhost:3001',
        changeOrigin: false,
      },
    },
  },
})
