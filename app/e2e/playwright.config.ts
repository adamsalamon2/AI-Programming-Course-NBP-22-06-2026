import { defineConfig, devices } from '@playwright/test';

/**
 * Hardware Service Decision Copilot — Playwright E2E configuration.
 *
 * Prerequisites (Step 3.2):
 *   1. Backend running on http://localhost:8080
 *      - Requires a real OpenRouter API key in app/.env
 *      - Start: cd app/backend && mvn spring-boot:run
 *   2. Frontend running on http://localhost:4200
 *      - Start: cd app/frontend && ng serve
 *
 * The webServer block below is intentionally disabled.
 * At Step 3.2 the orchestrator starts backend + frontend manually
 * (they are separate processes / separate tech stacks).
 * Uncomment and adapt when automated server startup is desired.
 */

// webServer examples (disabled — uncomment at Step 3.2):
// webServer: [
//   {
//     command: 'cd ../backend && mvn spring-boot:run -q',
//     url: 'http://localhost:8080/api/health',
//     reuseExistingServer: true,
//     timeout: 120_000,
//   },
//   {
//     command: 'cd ../frontend && ng serve --port 4200',
//     url: 'http://localhost:4200',
//     reuseExistingServer: true,
//     timeout: 120_000,
//   },
// ],

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',

  /* Each test gets a fresh browser context — no state leak between specs. */
  fullyParallel: false, // LLM calls are expensive; sequential avoids rate-limit bursts

  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,

  reporter: process.env.CI
    ? [['html', { open: 'never' }], ['list']]
    : [['html', { open: 'on-failure' }], ['list']],

  /* Global timeouts: LLM responses can take several seconds. */
  timeout: 120_000,          // per-test max (LLM can be slow)
  expect: { timeout: 15_000 }, // per-assertion retry window

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:4200',

    /* Comfortable timeouts for real LLM backend. */
    actionTimeout: 15_000,
    navigationTimeout: 30_000,

    /* Polish locale for correct date picker behaviour. */
    locale: 'pl-PL',
    timezoneId: 'Europe/Warsaw',

    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Uncomment for cross-browser at Step 3.3+:
    // { name: 'firefox',  use: { ...devices['Desktop Firefox'] } },
    // { name: 'webkit',   use: { ...devices['Desktop Safari'] } },
  ],
});
