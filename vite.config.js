import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5175, // default port
    strictPort: false, // allow to try next available port if 5173 is taken
  }
})
