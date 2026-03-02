import { test, expect } from './fixtures';

test.describe('Home Page', () => {
  test('should redirect root to /projects', async ({ authenticatedPage: page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/projects/);
  });

  test('should have header, main content, and footer visible', async ({ authenticatedPage: page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();
  });

  test('should show page title in browser tab', async ({ authenticatedPage: page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveTitle(/Projects.*AI Inspection/);
  });
});
