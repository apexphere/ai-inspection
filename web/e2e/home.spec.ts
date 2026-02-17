import { test, expect } from '@playwright/test';
import { test as authTest } from './fixtures';

test.describe('Home Page (Unauthenticated)', () => {
  test('should display welcome message', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: /ai inspection/i })).toBeVisible();
  });
});

authTest.describe('Home Page (Authenticated)', () => {
  authTest('should have navigation to inspections', async ({ authenticatedPage: page }) => {
    // Go back to home page
    await page.goto('/');

    // Should have a link to inspections
    const inspectionsLink = page.getByRole('link', { name: /inspections/i });
    await expect(inspectionsLink).toBeVisible();

    // Click and verify navigation
    await inspectionsLink.click();
    await expect(page).toHaveURL('/inspections');
  });
});
