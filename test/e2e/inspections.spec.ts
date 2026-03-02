/**
 * E2E Tests: Legacy Inspections routes (#624)
 *
 * All /inspections routes now redirect to /projects.
 * These tests verify the redirects work correctly.
 */
import { test, expect } from './fixtures';

test.describe('Legacy Inspections Redirects', () => {
  test('/inspections redirects to /projects', async ({ authenticatedPage: page }) => {
    await page.goto('/inspections');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/projects/);
  });

  test('/inspections/new redirects to /projects', async ({ authenticatedPage: page }) => {
    await page.goto('/inspections/new');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/projects/);
  });

  test('projects page loads with content after redirect', async ({ authenticatedPage: page }) => {
    await page.goto('/inspections');
    await page.waitForLoadState('networkidle');

    // After redirect, verify the projects page actually rendered
    await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible();
    await expect(page.getByText('View and manage your inspection projects')).toBeVisible();
  });
});
