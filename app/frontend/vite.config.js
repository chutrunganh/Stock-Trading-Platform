/* eslint-env node */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' }); // Adjust based on relative depth

export default defineConfig({
  plugins: [react()],  server: {
    // eslint-disable-next-line no-undef
    port: parseInt(process.env.FE_PORT),
    strictPort: true,
    host: true,
    proxy: {
      '/api': {
        // eslint-disable-next-line no-undef
        target: process.env.BE_URL,
        changeOrigin: true,
        secure: false,
        ws: true, // Enable WebSocket proxying
      }
    }
  }
})