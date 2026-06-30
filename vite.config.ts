import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Mapbox GL is intentionally isolated in its own lazily-loaded chunk; its
    // size is inherent to the library, so don't flag it on every build.
    chunkSizeWarningLimit: 2000,
  },
})
