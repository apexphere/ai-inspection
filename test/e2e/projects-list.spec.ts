/**
 * E2E Tests: Projects List Page
 *
 * Validates the /projects page renders a table with correct columns,
 * displays seeded project data, and handles empty/error states.
 *
 * Seed data (from seed-test-env.ts):
 *   - Project: TEST-001, activity "Test Inspection", COA, DRAFT
 *   - Property: 123 Test Street, Testville, Auckland
 *   - Client: Test Client
 */

import { test, expect } from './fixtures';

test.describe('Projects List — Table Rendering', () => {
  test('should display page heading and description', async ({ authenticatedPage: page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible();
    await expect(page.getByText('View and manage your inspection projects')).toBeVisible();
  });

  test('should render table with correct column headers', async ({ authenticatedPage: page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');

    // Wait for skeleton to disappear and table to appear
    const table = page.locator('table');
    await expect(table).toBeVisible({ timeout: 10000 });

    // Verify all column headers
    const headers = table.locator('thead th');
    await expect(headers.filter({ hasText: 'Job #' })).toBeVisible();
    await expect(headers.filter({ hasText: 'Address' })).toBeVisible();
    await expect(headers.filter({ hasText: 'Client' })).toBeVisible();
    await expect(headers.filter({ hasText: 'Status' })).toBeVisible();
    await expect(headers.filter({ hasText: 'Last Updated' })).toBeVisible();
  });

  test('should display seeded project data in the table', async ({ authenticatedPage: page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');

    const table = page.locator('table');
    await expect(table).toBeVisible({ timeout: 10000 });

    // Seeded project should appear with correct data
    const rows = table.locator('tbody tr');
    await expect(rows).not.toHaveCount(0);

    // Look for the seeded TEST-001 project data
    const testRow = rows.filter({ hasText: 'TEST-001' });
    await expect(testRow).toBeVisible();
    await expect(testRow).toContainText('123 Test Street');
    await expect(testRow).toContainText('Test Client');
    await expect(testRow).toContainText('Draft');
  });

  test('should show status badge with correct styling', async ({ authenticatedPage: page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');

    const table = page.locator('table');
    await expect(table).toBeVisible({ timeout: 10000 });

    // Draft status badge should have gray styling
    const draftBadge = table.locator('span.rounded-full', { hasText: 'Draft' }).first();
    await expect(draftBadge).toBeVisible();
    await expect(draftBadge).toHaveClass(/bg-gray-100/);
  });

  test('should display formatted dates in Last Updated column', async ({ authenticatedPage: page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');

    const table = page.locator('table');
    await expect(table).toBeVisible({ timeout: 10000 });

    // Date cells should contain a date-like string (e.g. "3/1/2026" or "1/03/2026")
    const testRow = table.locator('tbody tr').filter({ hasText: 'TEST-001' });
    const dateCell = testRow.locator('td').last();
    await expect(dateCell).toHaveText(/\d{1,2}\/\d{1,2}\/\d{4}/);
  });

  test('should navigate to project detail when clicking a row', async ({ authenticatedPage: page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');

    const table = page.locator('table');
    await expect(table).toBeVisible({ timeout: 10000 });

    const testRow = table.locator('tbody tr').filter({ hasText: 'TEST-001' });
    await expect(testRow).toBeVisible();
    await testRow.click();

    await expect(page).toHaveURL(/\/projects\/[\w-]+/);
  });

  test('should not show address as dash when data exists', async ({ authenticatedPage: page }) => {
    // This is a regression test for the property.address → property.streetAddress fix
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');

    const table = page.locator('table');
    await expect(table).toBeVisible({ timeout: 10000 });

    const testRow = table.locator('tbody tr').filter({ hasText: 'TEST-001' });
    const addressCell = testRow.locator('td').nth(1);

    // Address should NOT be a dash — it should show the actual street address
    await expect(addressCell).not.toHaveText('—');
    await expect(addressCell).toContainText('123 Test Street');
  });
});
