/**
 * E2E Tests: App Navigation
 *
 * Validates the header navigation links, active states, sign-out flow,
 * and auth guard behaviour.
 */

import { test, expect } from './fixtures';
import { test as baseTest } from '@playwright/test';

test.describe('Navigation — Header Links', () => {
  test('should show Projects link in desktop nav', async ({ authenticatedPage: page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');

    const header = page.locator('header');
    const projectsLink = header.locator('a[href="/projects"]');
    await expect(projectsLink).toBeVisible();
    await expect(projectsLink).toHaveText('Projects');
  });

  test('should show user email in desktop nav', async ({ authenticatedPage: page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');

    const header = page.locator('header');
    // The profile link shows the user's email
    const profileLink = header.locator('a[href="/profile"]');
    await expect(profileLink).toBeVisible();
    await expect(profileLink).toContainText('@');
  });

  test('should show Sign Out button', async ({ authenticatedPage: page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');

    const header = page.locator('header');
    await expect(header.getByRole('button', { name: 'Sign Out' })).toBeVisible();
  });

  test('should navigate to profile when clicking email', async ({ authenticatedPage: page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');

    const header = page.locator('header');
    await header.locator('a[href="/profile"]').click();
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL('/profile');
  });

  test('should navigate to projects when clicking Projects link', async ({ authenticatedPage: page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');

    const header = page.locator('header');
    await header.locator('a[href="/projects"]').click();
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/projects/);
  });

  test('should navigate to projects when clicking logo', async ({ authenticatedPage: page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');

    const header = page.locator('header');
    // Logo links to "/"
    await header.locator('a[href="/"]').click();
    await page.waitForLoadState('networkidle');

    // Root redirects to /projects
    await expect(page).toHaveURL(/\/projects/);
  });
});

test.describe('Navigation — Auth Guard', () => {
  baseTest('should redirect unauthenticated user to login', async ({ page }) => {
    // Add Vercel bypass header so we reach the actual app (not Vercel auth wall)
    const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
    if (bypassSecret) {
      await page.setExtraHTTPHeaders({
        'x-vercel-protection-bypass': bypassSecret,
      });
    }

    // No storageState — page is unauthenticated
    await page.context().clearCookies();
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/login/);
  });

  baseTest('should not show header on login page', async ({ page }) => {
    // Add Vercel bypass header so we reach the actual app (not Vercel auth wall)
    const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
    if (bypassSecret) {
      await page.setExtraHTTPHeaders({
        'x-vercel-protection-bypass': bypassSecret,
      });
    }

    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const header = page.locator('header');
    await expect(header).not.toBeVisible();
  });
});

test.describe('Navigation — Legacy Route Redirects', () => {
  test('root (/) redirects to /projects', async ({ authenticatedPage: page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/projects/);
  });

  test('/inspections redirects to /projects', async ({ authenticatedPage: page }) => {
    await page.goto('/inspections');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/projects/);
  });

  test('/inspections/new redirects to /projects', async ({ authenticatedPage: page }) => {
    await page.goto('/inspections/new');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/projects/);
  });
});
