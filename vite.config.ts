import { fileURLToPath, URL } from 'node:url';

import vue from '@vitejs/plugin-vue';
import { defineConfig, type UserConfig } from 'vite';

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
      checker({ typescript: true })
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
    // CSS / SCSS
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler',
          // Bootstrap still uses @import; silence deprecation warnings
          silenceDeprecations: ['import', 'if-function', 'global-builtin', 'legacy-js-api']
        }
      }
    },
    // Build Options
    // https://vitejs.dev/config/build-options.html
    build: {
      // Build Target
      target: 'esnext',
      // Minify option
      minify: 'esbuild'
    },
    esbuild: {
      // Drop console when production build.
      drop: command === 'serve' ? [] : ['console']
    }
  };
});
