import { defineConfig } from '@playwright/test';

/**
 * API-level end-to-end suite. Point it at a running instance with E2E_BASE_URL
 * (defaults to the local dev server). Expects a seeded database.
 */
const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:4000';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list']],
  use: {
    baseURL,
    extraHTTPHeaders: { Accept: 'application/json' },
    trace: 'on-first-retry',
  },
});
