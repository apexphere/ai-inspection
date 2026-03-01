/**
 * E2E Tests: /inspections/new redirect
 * The /inspections/new route now redirects to /projects (#624)
 */

import { test, expect } from './fixtures';

test.describe('Legacy /inspections/new redirect', () => {
  test('should redirect /inspections/new to /projects', async ({ authenticatedPage: page }) => {
    await page.goto('/inspections/new');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/projects/);
  });

  test('should redirect /inspections to /projects', async ({ authenticatedPage: page }) => {
    await page.goto('/inspections');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/projects/);
  });
});
