import { sentryVitePlugin } from "@sentry/vite-plugin";
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue(), sentryVitePlugin({
    org: "game-bx",
    project: "javascript-vue",
    authToken: process.env.SENTRY_AUTH_TOKEN,
    sourcemaps: {
      assets: ['./dist/assets/**']
    },
    telemetry: false
  })],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'pinia']
        }
      }
    }
  },
  server: {
    port: 3666
  }
})