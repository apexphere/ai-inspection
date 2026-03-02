/**
 * E2E Tests: Legacy /inspections/new redirect (#624)
 *
 * The old inspection creation flow has been replaced by the projects system.
 * All legacy routes redirect to /projects.
 */

import { test, expect } from './fixtures';

test.describe('Legacy /inspections/new redirect', () => {
  test('should redirect /inspections/new to /projects', async ({ authenticatedPage: page }) => {
    await page.goto('/inspections/new');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/projects/);
    // Verify the projects page actually loaded
    await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible();
  });
});
