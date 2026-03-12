import {
  defineConfig,
  fontProviders,
  passthroughImageService,
} from "astro/config";

// https://astro.build/config
export default defineConfig({
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
});
