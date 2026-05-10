import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react(), tailwindcss()],

  resolve: {
    // Prevent duplicate React instances (causes "Invalid hook call" with Vite 6)
    dedupe: ['react', 'react-dom', 'react-router-dom'],
    // Hard-pin React to a single physical path — catches cases dedupe misses in Docker
    alias: {
      react:      resolve(__dirname, 'node_modules/react'),
      'react-dom': resolve(__dirname, 'node_modules/react-dom'),
    },
  },

  server: {
    host: '0.0.0.0',
    port: 5173,
    // HMR inside Docker: tell the browser to connect back to localhost,
    // not the container's internal IP
    hmr: {
      protocol:   'ws',
      host:       'localhost',
      port:       5173,
      clientPort: 5173,
    },
    watch: {
      // macOS host → Linux container: polling required for hot reload
      usePolling: true,
      interval:   500,
    },
  },
})
