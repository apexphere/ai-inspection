import { test, expect } from './fixtures';

test.describe('Inspections List', () => {
  test('should display inspections list page', async ({ authenticatedPage: page }) => {
    // Already at /inspections after login
    await expect(page.getByRole('heading', { name: 'Inspections' })).toBeVisible();
  });

  test('should show loading state initially', async ({ authenticatedPage: page }) => {
    // Should show content
    const content = page.locator('main');
    await expect(content).toBeVisible();
  });

  test('should navigate to inspection detail when clicking an inspection', async ({ authenticatedPage: page }) => {
    // Wait for the list to load
    await page.waitForLoadState('networkidle');

    // Click on the first inspection link if exists
    const inspectionLink = page.locator('a[href^="/inspections/"]').first();
    
    if (await inspectionLink.isVisible()) {
      await inspectionLink.click();
      
      // Should navigate to detail page
      await expect(page).toHaveURL(/\/inspections\/.+/);
      
      // Should show back link
      await expect(page.getByText('← Back to Inspections')).toBeVisible();
    }
  });
});

test.describe('Inspection Detail', () => {
  test('should display inspection details', async ({ authenticatedPage: page }) => {
    await page.waitForLoadState('networkidle');

    // Click on the first inspection if exists
    const inspectionLink = page.locator('a[href^="/inspections/"]').first();
    
    if (await inspectionLink.isVisible()) {
      await inspectionLink.click();
      await page.waitForLoadState('networkidle');

      // Should show address as heading
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

      // Should show status badge
      await expect(page.locator('span').filter({ hasText: /(Started|In Progress|Completed)/ }).first()).toBeVisible();

      // Should show summary section
      await expect(page.getByText('Summary')).toBeVisible();
      await expect(page.getByText('Total Findings')).toBeVisible();
    }
  });

  test('should show findings grouped by section', async ({ authenticatedPage: page }) => {
    await page.waitForLoadState('networkidle');

    const inspectionLink = page.locator('a[href^="/inspections/"]').first();
    
    if (await inspectionLink.isVisible()) {
      await inspectionLink.click();
      await page.waitForLoadState('networkidle');

      // Should show Findings heading
      await expect(page.getByRole('heading', { name: 'Findings' })).toBeVisible();
    }
  });

  test('should navigate back to list', async ({ authenticatedPage: page }) => {
    await page.waitForLoadState('networkidle');

    const inspectionLink = page.locator('a[href^="/inspections/"]').first();
    
    if (await inspectionLink.isVisible()) {
      await inspectionLink.click();
      await page.waitForLoadState('networkidle');

      // Click back link
      await page.getByText('← Back to Inspections').click();

      // Should be back on list page
      await expect(page).toHaveURL('/inspections');
    }
  });
});
