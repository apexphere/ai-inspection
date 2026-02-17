/**
 * E2E Test Fixtures - Issue #72
 *
 * Provides authenticated page fixture for tests that need auth.
 */

import { test as base, Page } from '@playwright/test';

// Default test password - override with TEST_PASSWORD env var
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'test-password-123';

/**
 * Login helper - performs authentication and waits for redirect
 */
async function loginAs(page: Page, password: string = TEST_PASSWORD): Promise<void> {
  await page.goto('/login');

  // Fill password and submit
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');

  // Wait for redirect to inspections page
  await page.waitForURL('/inspections', { timeout: 10000 });
}

/**
 * Extended test fixtures with authentication support
 */
export const test = base.extend<{
  authenticatedPage: Page;
}>({
  /**
   * Pre-authenticated page fixture.
   * Use this for tests that access protected routes.
   */
  authenticatedPage: async ({ page }, runTest) => {
    await loginAs(page);
    await runTest(page);
  },
});

export { expect } from '@playwright/test';
export { loginAs };
