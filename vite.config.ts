import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carregar variáveis de ambiente baseado no modo
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    define: {
      // Expor variáveis de ambiente para o cliente
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY)
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
            'supabase-vendor': ['@supabase/supabase-js'],
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
      host: '0.0.0.0',
      strictPort: false
    },
    preview: {
      port: parseInt(process.env.PORT || '3000'),
      host: '0.0.0.0',
      strictPort: false,
      cors: true
    }
  }
})
