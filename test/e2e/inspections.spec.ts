/**
 * E2E Tests: Inspections → Projects navigation (#624)
 * /inspections now redirects to /projects
 */
import { test, expect } from './fixtures';

test.describe('Projects List', () => {
  test('should display projects list page', async ({ authenticatedPage: page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');

    // Should show the page heading or content
    const content = page.locator('main');
    await expect(content).toBeVisible();
  });

  test('/inspections redirects to /projects', async ({ authenticatedPage: page }) => {
    await page.goto('/inspections');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/projects/);
  });

  test('should navigate to project detail when clicking a project', async ({ authenticatedPage: page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');

    const projectLink = page.locator('a[href^="/projects/"]').first();

    if (await projectLink.isVisible()) {
      await projectLink.click();
      await expect(page).toHaveURL(/\/projects\/.+/);
    }
  });
});
