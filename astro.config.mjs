// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  integrations: [react()],
  devToolbar: { enabled: false },
  vite: {
    plugins: [tailwindcss()],
    // Vite 8's default CSS minifier (LightningCSS) rewrites vendor-prefixed rules: `.dlg__backdrop` and
    // `.vcard__expand` lost their unprefixed `backdrop-filter`, so the frosted glass vanished in Chrome.
    // esbuild is the minifier the site has always shipped with and leaves those declarations alone.
    // Vite 8 also emits `@media (width>=768px)` by default: phones older than iOS 16.4 ignore that syntax and
    // lose the whole responsive layout. This target is the newest one that still gets classic `min-width`
    // queries without rewriting anything else, so the CSS stays what the site shipped before the upgrade.
    build: {
      cssMinify: 'esbuild',
      // Same reason for scripts: Vite 8's default emits `static {}` class blocks that crash before iOS 16.4.
      target: ['edge88', 'firefox78', 'chrome87', 'safari14'],
      cssTarget: ['edge103', 'firefox100', 'chrome103', 'safari16.3'],
    },
    // Deps that only reach the browser through a LAZY island (client:visible / client:only) are discovered
    // late by Vite's optimizer: the first request 504s with "Outdated Optimize Dep", the dynamic import
    // aborts and the island never hydrates — e.g. the case-study view counters stayed at 0 until a manual
    // restart (owner saw this on /de/, 2026-10-19). Pre-bundling them at startup removes the race.
    optimizeDeps: { include: ['motion/react', 'three'] },
  },
  build: { inlineStylesheets: 'auto' },
});
