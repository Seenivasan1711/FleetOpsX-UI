import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],

  // Prevent duplicate React instances (causes "Invalid hook call" with Vite 6)
  resolve: {
    dedupe: ['react', 'react-dom', 'react-router-dom'],
  },

  server: {
    host: '0.0.0.0',
    port: 5173,
    // HMR inside Docker: tell the browser to connect back to localhost,
    // not the container's internal IP
    hmr: {
      host: 'localhost',
      clientPort: 5173,
    },
    watch: {
      // macOS host → Linux container: polling required for hot reload
      usePolling: true,
      interval: 500,
    },
  },
})
