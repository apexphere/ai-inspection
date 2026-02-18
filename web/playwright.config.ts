import { defineConfig, devices } from '@playwright/test';
import { config } from 'dotenv';

// Load .env.local for local testing
config({ path: '.env.local' });

const rawBaseURL = process.env.BASE_URL || 'http://localhost:3001';
const isDeployed = rawBaseURL.startsWith('https://');
const vercelBypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

// Append bypass token as query param for Vercel-protected deployments
const baseURL = vercelBypassSecret 
  ? `${rawBaseURL}?x-vercel-protection-bypass=${vercelBypassSecret}`
  : rawBaseURL;

/**
 * Playwright configuration for E2E tests
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? '50%' : undefined,
  reporter: process.env.CI ? 'github' : 'html',
  maxFailures: process.env.CI ? 3 : undefined,  // Fail-fast in CI

  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // Add Vercel bypass header for protected deployments
    extraHTTPHeaders: vercelBypassSecret ? {
      'x-vercel-protection-bypass': vercelBypassSecret,
    } : undefined,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Run local dev server before starting tests (skip for deployed envs) */
  webServer: isDeployed ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
