// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import netlify from "@astrojs/netlify";

import icon from "astro-icon";

export default defineConfig({
  output: "server",
  adapter: netlify(),

  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [icon()],
});