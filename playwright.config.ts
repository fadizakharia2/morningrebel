import {defineConfig, devices} from '@playwright/test';

/**
 * End-to-end tests run against the local dev server in fixture mode
 * (MR_DEV_FIXTURES=true in .env), so they need no Shopify credentials.
 */
const PORT = Number(process.env.E2E_PORT ?? 3000);

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'off',
  },
  projects: [
    {name: 'desktop', use: {...devices['Desktop Chrome'], viewport: {width: 1440, height: 900}}},
    {name: 'mobile', use: {...devices['Pixel 7']}},
  ],
  webServer: {
    command: `npx shopify hydrogen dev --port ${PORT} --codegen`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
