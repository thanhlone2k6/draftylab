// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  integrations: [react()],
  devToolbar: { enabled: false },
  vite: {
    plugins: [tailwindcss()],
    // Deps that only reach the browser through a LAZY island (client:visible / client:only) are discovered
    // late by Vite's optimizer: the first request 504s with "Outdated Optimize Dep", the dynamic import
    // aborts and the island never hydrates — e.g. the case-study view counters stayed at 0 until a manual
    // restart (owner saw this on /de/, 2026-10-19). Pre-bundling them at startup removes the race.
    optimizeDeps: { include: ['motion/react', 'three'] },
  },
  build: { inlineStylesheets: 'auto' },
});
