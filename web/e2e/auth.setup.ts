/**
 * Auth Setup - runs once before all tests to create authenticated state
 */

import { test as setup, expect } from '@playwright/test';

const TEST_PASSWORD = process.env.TEST_PASSWORD || 'test-password-123';
const AUTH_FILE = 'e2e/.auth/user.json';

setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  
  // Fill password and submit
  await page.fill('input[type="password"]', TEST_PASSWORD);
  await page.click('button[type="submit"]');
  
  // Wait for redirect to inspections page (confirms login worked)
  await page.waitForURL('/inspections', { timeout: 15000 });
  
  // Save signed-in state
  await page.context().storageState({ path: AUTH_FILE });
});
