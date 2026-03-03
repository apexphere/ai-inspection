/**
 * E2E Tests: Projects Search & Filtering
 *
 * Validates the search input, status filter dropdown, and column sorting
 * on the /projects page.
 */

import { test, expect } from './fixtures';

test.describe('Projects Search & Filter', () => {
  test('should display search input and status filter', async ({ authenticatedPage: page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');

    // Search input
    const searchInput = page.getByPlaceholder('Search by address or job number...');
    await expect(searchInput).toBeVisible();

    // Status filter dropdown
    const statusSelect = page.locator('select#status');
    await expect(statusSelect).toBeVisible();
  });

  test('should filter by search term matching address', async ({ authenticatedPage: page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');

    const table = page.locator('table');
    await expect(table).toBeVisible({ timeout: 30000 });

    // Search for the seeded address
    const searchInput = page.getByPlaceholder('Search by address or job number...');
    await searchInput.fill('Test Street');

    // Wait for debounced search to fire and results to update
    await page.waitForTimeout(500);
    await page.waitForLoadState('networkidle');

    // URL should have the search param
    await expect(page).toHaveURL(/search=Test/);

    // Table should still show the matching project
    await expect(table.locator('tbody tr').filter({ hasText: '123 Test Street' })).toBeVisible();
  });

  test('should filter by search term matching job number', async ({ authenticatedPage: page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');

    const table = page.locator('table');
    await expect(table).toBeVisible({ timeout: 30000 });

    const searchInput = page.getByPlaceholder('Search by address or job number...');
    await searchInput.fill('TEST-001');

    await page.waitForTimeout(500);
    await page.waitForLoadState('networkidle');

    await expect(table.locator('tbody tr').filter({ hasText: 'TEST-001' })).toBeVisible();
  });

  test('should show no results message for unmatched search', async ({ authenticatedPage: page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');

    const searchInput = page.getByPlaceholder('Search by address or job number...');
    await searchInput.fill('zzz-nonexistent-address-zzz');

    await page.waitForTimeout(500);
    await page.waitForLoadState('networkidle');

    // Should show empty state message
    await expect(page.getByText('No projects found')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Try adjusting your filters')).toBeVisible();
  });

  test('should filter by status dropdown', async ({ authenticatedPage: page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');

    const statusSelect = page.locator('select#status');
    await expect(statusSelect).toBeVisible();

    // Filter by DRAFT status — seeded project is DRAFT
    await statusSelect.selectOption('DRAFT');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/status=DRAFT/);

    // The seeded project should still be visible
    const table = page.locator('table');
    if (await table.isVisible()) {
      await expect(table.locator('tbody tr').filter({ hasText: 'TEST-001' })).toBeVisible();
    }
  });

  test('should show no results for non-matching status filter', async ({ authenticatedPage: page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');

    const statusSelect = page.locator('select#status');

    // Filter by COMPLETED — seeded project is DRAFT so it should disappear
    await statusSelect.selectOption('COMPLETED');
    await page.waitForLoadState('networkidle');

    // Either the table has no TEST-001 row, or the empty state shows
    const testRow = page.locator('table tbody tr').filter({ hasText: 'TEST-001' });
    await expect(testRow).toHaveCount(0);
  });

  test('should clear status filter when selecting All Status', async ({ authenticatedPage: page }) => {
    // Start with a status filter applied
    await page.goto('/projects?status=DRAFT');
    await page.waitForLoadState('networkidle');

    const statusSelect = page.locator('select#status');
    // Wait for client component to hydrate with the correct value
    await expect(statusSelect).toBeVisible({ timeout: 15000 });
    await expect(statusSelect).toHaveValue('DRAFT', { timeout: 10000 });

    // Clear the filter
    await statusSelect.selectOption('');
    // Wait for router.push to update the URL
    await page.waitForURL(url => !url.toString().includes('status='), { timeout: 10000 });

    // URL should not have status param
    expect(page.url()).not.toContain('status=');
  });
});

test.describe('Projects Column Sorting', () => {
  test('should sort by Job # when clicking column header', async ({ authenticatedPage: page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');

    const table = page.locator('table');
    await expect(table).toBeVisible({ timeout: 30000 });

    // Click Job # header
    const jobHeader = table.locator('thead th').filter({ hasText: 'Job #' });
    await jobHeader.click();
    await page.waitForLoadState('networkidle');

    // URL should have sort params
    await expect(page).toHaveURL(/sort=jobNumber/);
  });

  test('should toggle sort order on second click', async ({ authenticatedPage: page }) => {
    await page.goto('/projects?sort=jobNumber&order=desc');
    await page.waitForLoadState('networkidle');

    const table = page.locator('table');
    await expect(table).toBeVisible({ timeout: 30000 });

    // Click Job # header again to toggle to asc
    const jobHeader = table.locator('thead th').filter({ hasText: 'Job #' });
    await jobHeader.click();
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/order=asc/);
  });

  test('should show sort indicator arrow on active column', async ({ authenticatedPage: page }) => {
    await page.goto('/projects?sort=jobNumber&order=desc');
    await page.waitForLoadState('networkidle');

    const table = page.locator('table');
    await expect(table).toBeVisible({ timeout: 30000 });

    // The Job # header should have a down arrow indicator
    const jobHeader = table.locator('thead th').filter({ hasText: 'Job #' });
    await expect(jobHeader).toContainText('↓');
  });
});
