/**
 * Auth Setup - runs once before all tests to create authenticated state
 */

import { test as setup } from '@playwright/test';

// In CI, TEST_PASSWORD must be explicitly set — fail fast if missing
const isCI = process.env.CI === 'true';
const TEST_PASSWORD = process.env.TEST_PASSWORD;

if (!TEST_PASSWORD) {
  if (isCI) {
    throw new Error(
      'TEST_PASSWORD environment variable is required in CI. ' +
      'Set it to match the deployed API AUTH_PASSWORD.'
    );
  }
  console.warn(
    '⚠️  TEST_PASSWORD not set. Using default "test-password-123". ' +
    'Set TEST_PASSWORD to match your local API AUTH_PASSWORD.'
  );
}

const password = TEST_PASSWORD || 'test-password-123';
const AUTH_FILE = 'e2e/.auth/user.json';

setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  
  // Fill password and submit
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  
  // Wait for redirect to inspections page (confirms login worked)
  await page.waitForURL('/inspections', { timeout: 15000 });
  
  // Save signed-in state
  await page.context().storageState({ path: AUTH_FILE });
});
