import { test, expect } from './fixtures';

test.describe('Profile Page', () => {
  test('should be accessible from header email link', async ({ authenticatedPage: page }) => {
    await page.goto('/projects');
    const profileLink = page.locator('a[href="/profile"]').first();
    await expect(profileLink).toBeVisible();
    await profileLink.click();
    await expect(page).toHaveURL('/profile');
  });

  test('should display profile page with account details form', async ({ authenticatedPage: page }) => {
    await page.goto('/profile');
    await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Account Details' })).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#name')).toBeVisible();
    await expect(page.locator('#company')).toBeVisible();
    await expect(page.locator('#phone')).toBeVisible();
  });

  test('should load and display user profile data', async ({ authenticatedPage: page }) => {
    await page.goto('/profile');
    // Email field should be pre-filled with the logged-in user's email
    const emailInput = page.locator('#email');
    await expect(emailInput).not.toHaveValue('');
  });

  test('should update name and company successfully', async ({ authenticatedPage: page }) => {
    await page.goto('/profile');
    await page.locator('#name').fill('E2E Test Name');
    await page.locator('#company').fill('E2E Corp');
    await page.getByRole('button', { name: 'Save Changes' }).click();
    await expect(page.getByText('Profile updated successfully')).toBeVisible();
  });

  test('should show phone field with verify button', async ({ authenticatedPage: page }) => {
    await page.goto('/profile');
    await expect(page.locator('#phone')).toBeVisible();
    await expect(page.getByPlaceholder('+64 21 123 4567')).toBeVisible();
    // Verify button should exist (may be disabled if phone not saved)
    await expect(page.getByRole('button', { name: /Verify/ })).toBeVisible();
  });

  test('should save phone number without verification', async ({ authenticatedPage: page }) => {
    await page.goto('/profile');
    await page.locator('#phone').fill('+64211234567');
    await page.getByRole('button', { name: 'Save Changes' }).click();
    await expect(page.getByText('Profile updated successfully')).toBeVisible();
  });

  test('should require auth — redirect to login if not authenticated', async ({ page }) => {
    // Clear storage to simulate unauthenticated state
    await page.context().clearCookies();
    await page.goto('/profile');
    await expect(page).toHaveURL(/\/login/);
  });
});
