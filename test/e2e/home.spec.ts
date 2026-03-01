import { test, expect } from '@playwright/test';
import { test as authTest } from './fixtures';

test.describe('Home Page', () => {
  test('should redirect to projects', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Root redirects to /projects
    await expect(page).toHaveURL(/\/projects/);
  });

  authTest('should have nav and main content visible', async ({ authenticatedPage: page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');

    // Header should be present
    const header = page.locator('header');
    await expect(header).toBeVisible();

    // Main content should be present
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });
});
