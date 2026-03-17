import {
  defineConfig,
  fontProviders,
  passthroughImageService,
} from "astro/config";
// @ts-ignore
import icon from "astro-icon";
import partytown from "@astrojs/partytown";

import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  output: "server",
  site: "https://logue.dev",

  integrations: [
    icon(),
    partytown({
      config: {
        forward: ["dataLayer.push", "gtag"],
      },
    }),
  ],

  fonts: [
    {
      provider: fontProviders.local(),
      name: "ocra",
      cssVariable: "--font-ocra",
      fallbacks: ["monospace"],
      options: {
        variants: [
          {
            src: ["./src/assets/fonts/ocra.woff2"],
            weight: "normal",
            style: "normal",
          },
        ],
      },
    },
    {
      provider: fontProviders.google(),
      name: "WDXL Lubrifont JP N",
      cssVariable: "--font-lubri",
      fallbacks: ["sans-serif"],
    },
  ],

  image: {
    service: passthroughImageService(),
  },

  server: {
    port: 4321,
  },

  vite: {
    server: {
      strictPort: true,
    },
    resolve: {
      alias: {
        debug: "/src/shims/debug.ts",
      },
    },
  },

  adapter: cloudflare({
    prerenderEnvironment: "node",
  }),
});
