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

    // Breadcrumb nav has class "mb-4" — distinct from AppHeader nav
    const breadcrumb = page.locator('nav.mb-4');
    await expect(breadcrumb).toBeVisible();
    await expect(breadcrumb.getByText('Projects')).toBeVisible();

    // Projects breadcrumb should be a link back to /projects
    const projectsLink = breadcrumb.locator('a[href="/projects"]');
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

    // Use breadcrumb nav (class "mb-4") to avoid matching AppHeader nav
    const breadcrumb = page.locator('nav.mb-4');
    await breadcrumb.locator('a[href="/projects"]').click();
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/projects$/);
  });
});

test.describe('Project Detail — Collapsible Sections', () => {
  test('should display Project Info section with correct data', async ({ authenticatedPage: page }) => {
    await goToTestProject(page);

    // The section heading
    await expect(page.getByRole('heading', { name: 'Project Info', level: 2 })).toBeVisible();

    // Data fields — scoped to section to avoid strict mode violations
    const projectInfoSection = page.locator('#section-content-project-info');
    await expect(projectInfoSection.getByText('TEST-001')).toBeVisible();
    await expect(projectInfoSection.getByText('Test Inspection')).toBeVisible();
  });

  test('should display Client section with correct data', async ({ authenticatedPage: page }) => {
    await goToTestProject(page);

    const clientSection = page.locator('#section-content-client');
    await expect(page.getByRole('heading', { name: 'Client', level: 2 })).toBeVisible();
    await expect(clientSection.getByText('Test Client')).toBeVisible();
    await expect(clientSection.getByText('testclient@example.com')).toBeVisible();
  });

  test('should display Property section with correct data', async ({ authenticatedPage: page }) => {
    await goToTestProject(page);

    const propertySection = page.locator('#section-content-property');
    await expect(page.getByRole('heading', { name: 'Property', level: 2 })).toBeVisible();
    await expect(propertySection.getByText('123 Test Street')).toBeVisible();
    await expect(propertySection.getByText('Testville')).toBeVisible();
    await expect(propertySection.getByText('Auckland', { exact: true })).toBeVisible();
    await expect(propertySection.getByText('Auckland Council')).toBeVisible();
  });

  test('should display Inspections section with empty state', async ({ authenticatedPage: page }) => {
    await goToTestProject(page);

    await expect(page.getByRole('heading', { name: 'Inspections', level: 2 }).first()).toBeVisible();

    // Seeded project has no inspections
    await expect(page.getByText('No inspections recorded')).toBeVisible();
  });

  test('should display BRANZ Zone Data section', async ({ authenticatedPage: page }) => {
    await goToTestProject(page);

    await expect(page.getByRole('heading', { name: 'Site Data (BRANZ Maps)', level: 2 })).toBeVisible();
  });

  test('should display Documents section', async ({ authenticatedPage: page }) => {
    await goToTestProject(page);

    await expect(page.getByRole('heading', { name: 'Documents', level: 2 })).toBeVisible();
  });

  test('should display Photos section', async ({ authenticatedPage: page }) => {
    await goToTestProject(page);

    await expect(page.getByRole('heading', { name: 'Photos', level: 2 })).toBeVisible();
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
