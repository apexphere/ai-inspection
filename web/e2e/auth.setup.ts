/**
 * Auth Setup — Issue #275
 * 
 * Runs once before all tests to create authenticated state.
 * Uses seeded test user: test@example.com + TEST_PASSWORD
 */

import { test as setup } from '@playwright/test';

// Test user email (must match seed script)
const TEST_EMAIL = 'test@example.com';

// In CI, TEST_PASSWORD must be explicitly set — fail fast if missing
const isCI = process.env.CI === 'true';
const TEST_PASSWORD = process.env.TEST_PASSWORD;

if (!TEST_PASSWORD) {
  if (isCI) {
    throw new Error(
      'TEST_PASSWORD environment variable is required in CI. ' +
      'Set it in GitHub Secrets to match the deployed API.'
    );
  }
  console.warn(
    '⚠️  TEST_PASSWORD not set. Using default "test-password-123". ' +
    'Set TEST_PASSWORD to match your local seed.'
  );
}

const password = TEST_PASSWORD || 'test-password-123';
const AUTH_FILE = 'e2e/.auth/user.json';

setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  
  // Fill email and password
  await page.fill('input[type="email"]', TEST_EMAIL);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  
  // Wait for redirect to dashboard/projects (confirms login worked)
  await page.waitForURL(/\/(inspections|projects)/, { timeout: 15000 });
  
  // Save signed-in state
  await page.context().storageState({ path: AUTH_FILE });
});
