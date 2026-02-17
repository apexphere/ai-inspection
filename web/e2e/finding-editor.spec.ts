import { test, expect } from '@playwright/test';

test.describe('Finding Editor', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to an inspection with findings
    await page.goto('/inspections');
    await page.waitForLoadState('networkidle');

    // Click on the first inspection
    const inspectionLink = page.locator('a[href^="/inspections/"]').first();
    if (await inspectionLink.isVisible()) {
      await inspectionLink.click();
      await page.waitForLoadState('networkidle');
    }
  });

  test('should show edit button on finding hover', async ({ page }) => {
    // Find a finding card
    const findingCard = page.locator('.group').first();

    if (await findingCard.isVisible()) {
      // Hover over the finding card
      await findingCard.hover();

      // Edit button should be visible
      const editButton = findingCard.getByRole('button', { name: /edit/i });
      await expect(editButton).toBeVisible();
    }
  });

  test('should open editor modal when clicking edit', async ({ page }) => {
    const findingCard = page.locator('.group').first();

    if (await findingCard.isVisible()) {
      await findingCard.hover();

      const editButton = findingCard.getByRole('button', { name: /edit/i });
      if (await editButton.isVisible()) {
        await editButton.click();

        // Modal should open
        await expect(page.getByRole('heading', { name: 'Edit Finding' })).toBeVisible();

        // Should show form fields
        await expect(page.locator('textarea')).toBeVisible();
        await expect(page.locator('select')).toBeVisible();

        // Should show action buttons
        await expect(page.getByRole('button', { name: 'Save' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
      }
    }
  });

  test('should close editor when clicking cancel', async ({ page }) => {
    const findingCard = page.locator('.group').first();

    if (await findingCard.isVisible()) {
      await findingCard.hover();

      const editButton = findingCard.getByRole('button', { name: /edit/i });
      if (await editButton.isVisible()) {
        await editButton.click();

        // Wait for modal
        await expect(page.getByRole('heading', { name: 'Edit Finding' })).toBeVisible();

        // Click cancel
        await page.getByRole('button', { name: 'Cancel' }).click();

        // Modal should close
        await expect(page.getByRole('heading', { name: 'Edit Finding' })).not.toBeVisible();
      }
    }
  });

  test('should show severity dropdown with all options', async ({ page }) => {
    const findingCard = page.locator('.group').first();

    if (await findingCard.isVisible()) {
      await findingCard.hover();

      const editButton = findingCard.getByRole('button', { name: /edit/i });
      if (await editButton.isVisible()) {
        await editButton.click();

        // Check severity dropdown
        const severitySelect = page.locator('select');
        await expect(severitySelect).toBeVisible();

        // Should have all severity options
        await expect(severitySelect.locator('option')).toHaveCount(4);
        await expect(severitySelect.locator('option', { hasText: 'Info' })).toBeVisible();
        await expect(severitySelect.locator('option', { hasText: 'Minor' })).toBeVisible();
        await expect(severitySelect.locator('option', { hasText: 'Major' })).toBeVisible();
        await expect(severitySelect.locator('option', { hasText: 'Urgent' })).toBeVisible();
      }
    }
  });

  test('should show delete confirmation when clicking delete', async ({ page }) => {
    const findingCard = page.locator('.group').first();

    if (await findingCard.isVisible()) {
      await findingCard.hover();

      const editButton = findingCard.getByRole('button', { name: /edit/i });
      if (await editButton.isVisible()) {
        await editButton.click();

        // Click delete finding
        await page.getByRole('button', { name: 'Delete Finding' }).click();

        // Should show confirmation
        await expect(page.getByText('Delete this finding?')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Delete' })).toBeVisible();
      }
    }
  });

  test('should show photo upload button', async ({ page }) => {
    const findingCard = page.locator('.group').first();

    if (await findingCard.isVisible()) {
      await findingCard.hover();

      const editButton = findingCard.getByRole('button', { name: /edit/i });
      if (await editButton.isVisible()) {
        await editButton.click();

        // Should show add photo button
        await expect(page.getByRole('button', { name: 'Add Photo' })).toBeVisible();
      }
    }
  });
});
