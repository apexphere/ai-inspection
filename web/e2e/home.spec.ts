import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should display welcome message', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: /ai inspection/i })).toBeVisible();
  });

  test('should have navigation to inspections', async ({ page }) => {
    await page.goto('/');

    // Should have a link to inspections
    const inspectionsLink = page.getByRole('link', { name: /inspections/i });
    await expect(inspectionsLink).toBeVisible();

    // Click and verify navigation
    await inspectionsLink.click();
    await expect(page).toHaveURL('/inspections');
  });
});
