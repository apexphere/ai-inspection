import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/__tests__/**/*.integration.test.ts'],
    environment: 'node',
    // Integration tests may need longer timeouts
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
