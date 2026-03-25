import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 120_000,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list']],
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:5180',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: process.env.E2E_WEB_SERVER
    ? undefined
    : [
        {
          command: 'npm run dev:e2e',
          url: 'http://127.0.0.1:5180',
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        },
      ],
});

