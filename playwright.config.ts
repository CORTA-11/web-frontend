import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    // Contract tests own API interception through page.route(). A service
    // worker would claim those requests first and let unmatched calls escape
    // through Next's rewrite to a backend that CI does not start.
    serviceWorkers: 'block',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    env: {
      NEXT_PUBLIC_MOCKS: 'off',
    },
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
