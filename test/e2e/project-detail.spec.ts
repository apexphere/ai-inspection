/**
 * E2E Tests: Project Detail Page
 *
 * Validates /projects/:id renders breadcrumbs, header info, and collapsible
 * sections for project info, client, property, inspections, documents, photos.
 */

import { test, expect } from './fixtures';
import type { Page } from '@playwright/test';

/**
 * Navigate to the seeded TEST-001 project detail page.
 * Returns the page if navigation succeeds, otherwise skips the test.
 */
async function goToTestProject(page: Page): Promise<void> {
  await page.goto('/projects');
  await page.waitForLoadState('networkidle');

  // Wait for the projects table — may take time while session/token loads
  const table = page.locator('table');
  await expect(table).toBeVisible({ timeout: 30000 });

  const testRow = table.locator('tbody tr').filter({ hasText: 'TEST-001' });
  await expect(testRow).toBeVisible({ timeout: 10000 });
  await testRow.click();
  await page.waitForLoadState('networkidle');

  // Confirm we landed on a project detail page
  await expect(page).toHaveURL(/\/projects\/[\w-]+/);
}

test.describe('Project Detail — Header & Breadcrumbs', () => {
  test('should display breadcrumb navigation', async ({ authenticatedPage: page }) => {
    await goToTestProject(page);

    // Breadcrumb: Projects / TEST-001
    const nav = page.locator('nav');
    await expect(nav.getByText('Projects')).toBeVisible();

    // Projects breadcrumb should be a link back to /projects
    const projectsLink = nav.locator('a[href="/projects"]');
    await expect(projectsLink).toBeVisible();
  });

  test('should display property address as page title', async ({ authenticatedPage: page }) => {
    await goToTestProject(page);

    await expect(page.getByRole('heading', { name: '123 Test Street' })).toBeVisible();
  });

  test('should show job number in header subtitle', async ({ authenticatedPage: page }) => {
    await goToTestProject(page);

    await expect(page.getByText('Job: TEST-001')).toBeVisible();
  });

  test('should show report type label', async ({ authenticatedPage: page }) => {
    await goToTestProject(page);

    // COA → "Certificate of Acceptance"
    await expect(page.getByText('Certificate of Acceptance')).toBeVisible();
  });

  test('should display status badge', async ({ authenticatedPage: page }) => {
    await goToTestProject(page);

    const badge = page.locator('span.rounded-full', { hasText: 'Draft' });
    await expect(badge).toBeVisible();
  });

  test('should navigate back to projects list via breadcrumb', async ({ authenticatedPage: page }) => {
    await goToTestProject(page);

    const projectsLink = page.locator('nav a[href="/projects"]');
    await projectsLink.click();
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/projects$/);
  });
});

test.describe('Project Detail — Collapsible Sections', () => {
  test('should display Project Info section with correct data', async ({ authenticatedPage: page }) => {
    await goToTestProject(page);

    // The section heading
    await expect(page.getByText('Project Info')).toBeVisible();

    // Data fields
    await expect(page.getByText('TEST-001')).toBeVisible();
    await expect(page.getByText('Test Inspection')).toBeVisible();
  });

  test('should display Client section with correct data', async ({ authenticatedPage: page }) => {
    await goToTestProject(page);

    await expect(page.getByText('Client')).toBeVisible();
    await expect(page.getByText('Test Client')).toBeVisible();
    await expect(page.getByText('testclient@example.com')).toBeVisible();
  });

  test('should display Property section with correct data', async ({ authenticatedPage: page }) => {
    await goToTestProject(page);

    await expect(page.getByText('Property')).toBeVisible();
    await expect(page.getByText('123 Test Street')).toBeVisible();
    await expect(page.getByText('Testville')).toBeVisible();
    await expect(page.getByText('Auckland')).toBeVisible();
    await expect(page.getByText('Auckland Council')).toBeVisible();
  });

  test('should display Inspections section with empty state', async ({ authenticatedPage: page }) => {
    await goToTestProject(page);

    await expect(page.getByText('Inspections')).toBeVisible();

    // Seeded project has no inspections
    await expect(page.getByText('No inspections recorded')).toBeVisible();
  });

  test('should display BRANZ Zone Data section', async ({ authenticatedPage: page }) => {
    await goToTestProject(page);

    await expect(page.getByText('BRANZ Zone Data')).toBeVisible();
  });

  test('should display Documents section', async ({ authenticatedPage: page }) => {
    await goToTestProject(page);

    await expect(page.getByText('Documents')).toBeVisible();
  });

  test('should display Photos section', async ({ authenticatedPage: page }) => {
    await goToTestProject(page);

    await expect(page.getByText('Photos')).toBeVisible();
  });
});

test.describe('Project Detail — 404 Handling', () => {
  test('should show 404 page for non-existent project ID', async ({ authenticatedPage: page }) => {
    await page.goto('/projects/00000000-0000-0000-0000-000000000000');
    await page.waitForLoadState('networkidle');

    // Next.js notFound() renders a 404 page
    await expect(page.getByText(/not found/i)).toBeVisible();
  });
});
