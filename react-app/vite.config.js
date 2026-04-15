import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Split heavy libraries into their own chunks
          if (id.includes('xlsx')) return 'vendor-xlsx';
          if (id.includes('chart.js')) return 'vendor-charts';
          // Other node_modules go to a generic vendor chunk
          if (id.includes('node_modules')) return 'vendor';
        }
      }
    }
  }
})
