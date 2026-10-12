// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import { glideSourceStamping } from '@srivarsank/glide/vite-plugin';

// https://astro.build/config
export default defineConfig({
  site: 'https://draftylab.pages.dev',
  i18n: {
    defaultLocale: 'vi',
    locales: ['vi', 'en'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  integrations: [sitemap(), react()],
  vite: {
    plugins: [tailwindcss(), glideSourceStamping()],
  },
  build: {
    inlineStylesheets: 'auto',
  },
});
