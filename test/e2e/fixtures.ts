/**
 * E2E Test Fixtures - Issue #72
 *
 * Auth is handled via storageState (see auth.setup.ts).
 * All tests in chromium project automatically have authenticated state.
 */

import { test as base, Page } from '@playwright/test';

/**
 * Extended test fixtures
 * 
 * authenticatedPage is kept for backwards compatibility.
 * With storageState configured, the page is already authenticated.
 */
export const test = base.extend<{
  authenticatedPage: Page;
}>({
  /**
   * Authenticated page fixture.
   * Auth is already loaded via storageState - just use the page directly.
   */
  authenticatedPage: async ({ page }, runTest) => {
    await runTest(page);
  },
});

export { expect } from '@playwright/test';
