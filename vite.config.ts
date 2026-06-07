import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte()],
  server: {
    // Bind to all interfaces and use a fixed port so the host can reach the
    // dev server through the published Docker port. Polling makes file
    // watching reliable across the macOS <-> Linux bind mount; clientPort
    // keeps the HMR websocket pointed at the published host port.
    host: true,
    port: 5173,
    strictPort: true,
    watch: { usePolling: true },
    hmr: { clientPort: 5173 },
  },
})
