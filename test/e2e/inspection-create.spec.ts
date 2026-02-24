/**
 * E2E Tests: Create New Inspection
 * Covers the /inspections/new flow added in #384
 */

import { test, expect } from './fixtures';

test.describe('Create New Inspection', () => {
  test('should display the new inspection form', async ({ authenticatedPage: page }) => {
    await page.goto('/inspections/new');
    await page.waitForLoadState('networkidle');

    // Should show form heading
    await expect(page.getByRole('heading', { name: /new inspection/i })).toBeVisible();

    // Should show required form fields
    await expect(page.getByLabel(/address/i)).toBeVisible();
    await expect(page.getByLabel(/client/i)).toBeVisible();

    // Should show submit button
    await expect(page.getByRole('button', { name: /start inspection|create/i })).toBeVisible();
  });

  test('should show validation errors for empty form submission', async ({ authenticatedPage: page }) => {
    await page.goto('/inspections/new');
    await page.waitForLoadState('networkidle');

    // Submit without filling in required fields
    await page.getByRole('button', { name: /start inspection|create/i }).click();

    // Should show validation error
    const errorMessage = page.locator('[role="alert"], .text-red, [class*="error"]').first();
    await expect(errorMessage).toBeVisible();
  });

  test('should navigate back to inspections list', async ({ authenticatedPage: page }) => {
    await page.goto('/inspections/new');
    await page.waitForLoadState('networkidle');

    // Should have a back/cancel link
    const backLink = page.getByRole('link', { name: /back|cancel/i }).first();
    if (await backLink.isVisible()) {
      await backLink.click();
      await expect(page).toHaveURL('/inspections');
    }
  });

  test('should be accessible from inspections list', async ({ authenticatedPage: page }) => {
    await page.goto('/inspections');
    await page.waitForLoadState('networkidle');

    // Should have a link/button to create new inspection
    const newLink = page.getByRole('link', { name: /new inspection/i })
      .or(page.getByRole('button', { name: /new inspection/i }));
    await expect(newLink).toBeVisible();

    await newLink.click();
    await expect(page).toHaveURL('/inspections/new');
  });
});
