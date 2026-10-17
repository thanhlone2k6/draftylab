import { defineConfig, devices } from '@playwright/test';

// E2E runs against the production build (astro preview), not the dev server.
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 120_000,
  fullyParallel: false,
  workers: 2,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:4322', trace: 'retain-on-failure' },
  testIgnore: /phase3\.spec/, // phase 3 runs only in the `lead-live` project below
  webServer: [
    { command: 'npx astro preview --port 4322', url: 'http://localhost:4322', reuseExistingServer: true, timeout: 120_000 },
    // Production-like: static site WITHOUT the big videos + real Pages Functions on workerd + local D1/R2 (no network).
    // Needs `npm run build:lead` and `npm run lead:local-r2` first (see docs/phase3-3a-report.md).
    { command: 'npx wrangler pages dev dist-lead --port 8788 --compatibility-date=2026-10-01 --local', url: 'http://localhost:8788', reuseExistingServer: true, timeout: 180_000 },
  ],
  projects: [
    { name: 'lead-live', testMatch: /phase3\.spec/, testIgnore: [], use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:8788', viewport: { width: 1440, height: 900 } } },
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } } },
    { name: 'desktop-webkit', use: { ...devices['Desktop Safari'], viewport: { width: 1440, height: 900 } }, grep: /@webkit/ },
    // iPhone emulation in WebKit — NOT a real-device test (see docs/test-report.md).
    { name: 'mobile-webkit', use: { ...devices['iPhone 14'], viewport: { width: 390, height: 844 } }, grep: /@webkit/ },
  ],
});
