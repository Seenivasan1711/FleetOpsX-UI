import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    watch: {
      // macOS host → Linux container: inotify events don't propagate,
      // so polling is required for hot reload to work inside Docker
      usePolling: true,
      interval: 500,
    },
  },
})
