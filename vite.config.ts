import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    target: 'es2015',
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'supabase-vendor': ['@supabase/supabase-js', '@supabase/gotrue-js'],
          'ui-vendor': ['sonner', '@tanstack/react-query', 'zustand', 'next-themes'],
          'radix-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-popover',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-slot'
          ],
          'utils-vendor': ['class-variance-authority', 'clsx', 'tailwind-merge', 'lucide-react']
        }
      }
    },
    emptyOutDir: true,
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    commonjsOptions: {
      include: [/node_modules/],
      extensions: ['.js', '.cjs']
    }
  },
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react-router-dom',
      'sonner',
      '@tanstack/react-query',
      'zustand',
      'next-themes',
      'class-variance-authority',
      'clsx',
      'tailwind-merge',
      'lucide-react',
      'react-resizable-panels',
      '@radix-ui/react-dialog',
      '@radix-ui/react-popover',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-tooltip',
      '@radix-ui/react-slot',
      '@radix-ui/react-toast',
      '@radix-ui/react-switch',
      '@radix-ui/react-label'
    ]
  },
  server: {
    port: 3000,
    host: true
  }
})
