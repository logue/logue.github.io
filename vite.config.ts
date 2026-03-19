import { fileURLToPath, URL } from 'node:url';

import vue from '@vitejs/plugin-vue';
import { defineConfig, type UserConfig } from 'vite';

import { cloudflare } from '@cloudflare/vite-plugin';
import { checker } from 'vite-plugin-checker';
import vueDevTools from 'vite-plugin-vue-devtools';

// https://vitejs.dev/config/
export default defineConfig(({ command }): UserConfig => {
  return {
    plugins: [
      // Vue 3
      vue(),
      // Vue DevTools
      vueDevTools(),
      // TypeScript checker
      // https://github.com/fi3ework/vite-plugin-checker
      checker({ typescript: true }),
      // Cloudflare Workers
      cloudflare()
    ],
    // Resolver
    resolve: {
      // https://vitejs.dev/config/shared-options.html#resolve-alias
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '~': fileURLToPath(new URL('./node_modules', import.meta.url))
      },
      extensions: ['.js', '.json', '.jsx', '.mjs', '.ts', '.tsx', '.vue']
    },
    // Build Options
    // https://vitejs.dev/config/build-options.html
    build: {
      // Build Target
      target: 'esnext',
      // Minify option
      minify: 'esbuild',
      // Rollup Options
      // https://vitejs.dev/config/build-options.html#build-rollupoptions
      rollupOptions: {
        output: {
          manualChunks: (id: string) => {
            // Split external library from transpiled code.
            if (
              id.includes('/node_modules/vuetify') ||
              id.includes('/node_modules/webfontloader') ||
              id.includes('/node_modules/@mdi')
            ) {
              // Split Vuetify before vue.
              return 'vuetify';
            }
            if (
              id.includes('/node_modules/@vue/') ||
              id.includes('/node_modules/vue') ||
              id.includes('/node_modules/pinia') ||
              id.includes('/node_modules/destr/') || // pinia-plugin-persistedstate uses destr.
              id.includes('/node_modules/deep-pick-omit/') // pinia-plugin-persistedstate uses deep-pick-omit.
            ) {
              // Combine Vue and Pinia into a single chunk.
              // This is because Pinia is a state management library for Vue.
              return 'vue';
            }
            if (
              id.includes('/node_modules/three/') ||
              id.includes('/node_modules/@pixiv/three-vrm')
            ) {
              // Combine Three.js and VRM into a single chunk.
              // This is because VRM is a 3D model format for Three.js.
              return 'three';
            }
            // Others
            if (id.includes('/node_modules/')) {
              return 'vendor';
            }
          }
        }
      }
    },
    esbuild: {
      // Drop console when production build.
      drop: command === 'serve' ? [] : ['console']
    }
  };
});
