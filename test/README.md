# E2E Tests

End-to-end tests using Playwright.

## Setup

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install chromium
```

## Running Tests

```bash
# Run all tests
npm test

# Run with UI
npm run test:ui

# Run in headed mode (see browser)
npm run test:headed

# Debug a test
npm run test:debug

# View last report
npm run test:report
```

## Environment Variables

Create `.env.local` for local testing:

```bash
# Web app URL
BASE_URL=http://localhost:3001

# API URL (for seeding/validation)
API_URL=http://localhost:3000

# Test user password (must match seeded user)
TEST_PASSWORD=test123
```

For CI, these are set via GitHub Secrets:
- `TEST_PASSWORD`
- `VERCEL_AUTOMATION_BYPASS_SECRET`

## Test Structure

```
test/
├── e2e/
│   ├── .auth/           # Auth state (gitignored)
│   ├── auth.setup.ts    # Login setup (runs first)
│   ├── fixtures.ts      # Shared test fixtures
│   └── *.spec.ts        # Test files
├── playwright.config.ts # Playwright configuration
└── package.json         # Test scripts
```

## Writing Tests

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should do expected behavior', async ({ page }) => {
    await page.goto('/path');
    await expect(page.locator('h1')).toContainText('Expected');
  });
});
```

## Auth

Tests run authenticated by default. The `auth.setup.ts` runs first to create auth state, which is reused by all tests.

Test user: `test@example.com` (password from `TEST_PASSWORD` env var)
