import { defineConfig, devices } from "@playwright/test";

const port = process.env.PLAYWRIGHT_PORT ?? "3000";

export default defineConfig({
  testDir: "./tests/live",
  webServer: {
    command: `npm run dev -- --port ${port}`,
    env: {
      ...process.env,
      NEXT_PUBLIC_LIVE_MODULES: "auth,teams,docs",
      NEXT_PUBLIC_MOCKS: "off",
      API_PROXY_TARGET: process.env.API_PROXY_TARGET ?? "http://127.0.0.1:8080",
    },
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
  },
  timeout: 30_000,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
