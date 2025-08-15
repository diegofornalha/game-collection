import { sentryVitePlugin } from "@sentry/vite-plugin";
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [
    vue({
      // OTIMIZAÇÃO: Template compilation optimizations
      template: {
        compilerOptions: {
          // Remove whitespace and comments in production
          whitespace: 'condense'
        }
      }
    }),
    
    sentryVitePlugin({
      org: "game-bx",
      project: "javascript-vue",
      authToken: process.env.SENTRY_AUTH_TOKEN,
      sourcemaps: {
        assets: ['./dist/assets/**']
      },
      telemetry: false
    })
  ],
  
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: process.env.NODE_ENV === 'development',
    
    // OTIMIZAÇÃO: Target moderno para melhor tree-shaking
    target: 'es2020',
    
    // OTIMIZAÇÃO: Minification avançada
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        dead_code: true,
        inline: 2
      },
      mangle: {
        keep_fnames: process.env.NODE_ENV === 'development'
      }
    },
    
    rollupOptions: {
      output: {
        // OTIMIZAÇÃO: Chunks granulares e inteligentes
        manualChunks(id) {
          // Vendor chunk para dependências principais
          if (id.includes('node_modules')) {
            if (id.includes('vue') || id.includes('@vue')) {
              return 'vue-core';
            }
            if (id.includes('pinia')) {
              return 'state-management';
            }
            if (id.includes('@sentry')) {
              return 'monitoring';
            }
            if (id.includes('date-fns') || id.includes('@vueuse')) {
              return 'utilities';
            }
            return 'vendor';
          }
          
          // Game engine chunks
          if (id.includes('/models/') || id.includes('/services/gameWorker')) {
            return 'game-engine';
          }
          
          // UI components
          if (id.includes('/components/')) {
            if (id.includes('TileField') || id.includes('GameView')) {
              return 'game-ui';
            }
            if (id.includes('Navigation') || id.includes('common/')) {
              return 'common-ui';
            }
            if (id.includes('animations/') || id.includes('XPDisplay')) {
              return 'animations';
            }
            return 'ui-components';
          }
          
          if (id.includes('/stores/')) {
            return 'stores';
          }
          
          if (id.includes('/services/')) {
            return 'services';
          }
        },
        
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    
    // OTIMIZAÇÃO: Chunk size warnings
    chunkSizeWarningLimit: 1000,
    
    // OTIMIZAÇÃO: Assets inlining threshold
    assetsInlineLimit: 4096,
    
    // OTIMIZAÇÃO: CSS code splitting
    cssCodeSplit: true
  },
  
  server: {
    port: 3666,
    hmr: {
      overlay: false
    }
  },
  
  // OTIMIZAÇÃO: Dependencies optimization
  optimizeDeps: {
    include: [
      'vue',
      'pinia',
      '@vueuse/core',
      'date-fns'
    ]
  },
  
  // OTIMIZAÇÃO: Define global replacements
  define: {
    __VUE_OPTIONS_API__: false,
    __VUE_PROD_DEVTOOLS__: false,
    __ENABLE_PERFORMANCE_PROFILING__: process.env.NODE_ENV === 'development',
    __ENABLE_MEMORY_DEBUGGING__: process.env.NODE_ENV === 'development'
  }
});