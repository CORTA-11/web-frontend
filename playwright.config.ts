import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { chromium, defineConfig, devices } from '@playwright/test';

const port = process.env.PLAYWRIGHT_PORT ?? '3100';
const baseURL = `http://127.0.0.1:${port}`;
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function chromiumExecutable() {
  if (process.env.CI) return '/usr/bin/chromium';
  if (existsSync(chromium.executablePath())) return undefined;
  const flatpakPath = 'app/com.google.Chrome/current/active/files/extra/chrome';
  return [
    join('/var/lib/flatpak', flatpakPath),
    join(homedir(), '.local/share/flatpak', flatpakPath),
  ].find(existsSync);
}

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  testIgnore: '**/live/**',
  webServer: {
    command: `${npmCommand} run dev -- --port ${port}`,
    timeout: 120_000,
    env: {
      ...process.env,
      NEXT_PUBLIC_LIVE_MODULES: '',
      NEXT_PUBLIC_MOCKS: 'on',
      API_PROXY_TARGET: 'http://127.0.0.1:9',
    },
    url: baseURL,
    // Reusing a dev server can silently run these mock tests against live API settings.
    reuseExistingServer: false,
  },
  fullyParallel: true,
  expect: { timeout: 15_000 },
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Cold route compilation on the dev server can exhaust the per-test timeout.
  workers: 1,
  reporter: 'html',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        launchOptions: { executablePath: chromiumExecutable() },
      },
    },
    
    /* Commented out because system Firefox lacks the required Juggler patches */
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
  ],
});
