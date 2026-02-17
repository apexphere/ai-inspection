/* eslint-disable react-hooks/rules-of-hooks */
/**
 * E2E Test Fixtures — Issue #72
 *
 * Provides authenticated page fixture for tests requiring login.
 */

import { test as base, Page } from '@playwright/test';

const TEST_PASSWORD = process.env.TEST_PASSWORD || 'test';

/**
 * Login helper - authenticates the page
 */
async function login(page: Page): Promise<void> {
  await page.goto('/login');
  await page.fill('input[type="password"]', TEST_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL('/inspections', { timeout: 10000 });
}

/**
 * Extended test with authenticated page fixture
 */
export const test = base.extend<{ authenticatedPage: Page }>({
  authenticatedPage: async ({ page }, use) => {
    await login(page);
    await use(page);
  },
});

export { expect } from '@playwright/test';
export { login };
