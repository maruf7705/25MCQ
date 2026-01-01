import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  },
  build: {
    // Target modern browsers for smaller bundles
    target: 'es2015',

    // Optimize chunk size
    chunkSizeWarningLimit: 1000,

    rollupOptions: {
      output: {
        // Manual chunking for better caching
        manualChunks(id) {
          // Vendor chunk - React libraries
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor'
          }

          // Router chunk
          if (id.includes('node_modules/react-router-dom')) {
            return 'router'
          }

          // Math rendering library separate (large dependency)
          if (id.includes('node_modules/katex') || id.includes('node_modules/react-katex')) {
            return 'katex'
          }

          // HTML to canvas library
          if (id.includes('node_modules/html2canvas')) {
            return 'html2canvas'
          }

          // Admin components in separate chunk (not needed for students)
          if (id.includes('/admin/') || id.includes('AdminPage')) {
            return 'admin'
          }
        },
        // Better file naming for caching
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },

    // Use esbuild minifier (faster and more reliable than terser)
    minify: 'esbuild',

    // Source maps for debugging (disable in production for smaller size)
    sourcemap: false
  },

  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom']
  }
})
