import { test, expect } from '@playwright/test';
import { test as authTest } from './fixtures';

test.describe('Home Page', () => {
  test('should redirect to projects', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Root redirects to /projects
    await expect(page).toHaveURL(/\/projects/);
  });

  authTest('should have navigation to projects', async ({ authenticatedPage: page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');

    // Should have a Projects link in the nav
    const projectsLink = page.getByRole('link', { name: 'Projects', exact: true }).first();
    await expect(projectsLink).toBeVisible();
  });
});
