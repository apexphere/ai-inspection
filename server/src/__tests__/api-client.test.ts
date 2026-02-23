/**
 * API Client Tests — Issue #379
 *
 * Tests for service-to-service authentication with SERVICE_API_KEY.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('API Client', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('SERVICE_API_KEY header', () => {
    it('should include X-API-Key header when SERVICE_API_KEY is set', async () => {
      // Set up environment
      process.env.SERVICE_API_KEY = 'test-api-key-12345';
      process.env.API_URL = 'http://localhost:3000';

      // Mock fetch
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ id: '123' }),
      });
      global.fetch = mockFetch;

      // Import fresh module with new env
      const { inspectionApi } = await import('../api/client.js');

      // Make a request
      await inspectionApi.get('test-id');

      // Verify X-API-Key header was included
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/inspections/test-id',
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-API-Key': 'test-api-key-12345',
          }),
        })
      );
    });

    it('should not include X-API-Key header when SERVICE_API_KEY is not set', async () => {
      // Ensure no API key
      delete process.env.SERVICE_API_KEY;
      process.env.API_URL = 'http://localhost:3000';

      // Mock fetch
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ id: '123' }),
      });
      global.fetch = mockFetch;

      // Import fresh module
      const { inspectionApi } = await import('../api/client.js');

      // Make a request
      await inspectionApi.get('test-id');

      // Verify X-API-Key header was NOT included
      const callArgs = mockFetch.mock.calls[0];
      const headers = callArgs[1]?.headers as Record<string, string>;
      expect(headers['X-API-Key']).toBeUndefined();
    });

    it('should include X-API-Key in POST requests with body', async () => {
      process.env.SERVICE_API_KEY = 'test-api-key-12345';
      process.env.API_URL = 'http://localhost:3000';

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: () => Promise.resolve({ id: '123' }),
      });
      global.fetch = mockFetch;

      const { inspectionApi } = await import('../api/client.js');

      await inspectionApi.create({
        address: '123 Test St',
        clientName: 'Test Client',
        checklistId: 'nz-ppi',
        currentSection: 'exterior',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/inspections',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-API-Key': 'test-api-key-12345',
          }),
          body: expect.any(String),
        })
      );
    });
  });

  describe('API_URL configuration', () => {
    it('should use API_URL from environment', async () => {
      process.env.API_URL = 'https://api.example.com';
      delete process.env.SERVICE_API_KEY;

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ id: '123' }),
      });
      global.fetch = mockFetch;

      const { inspectionApi } = await import('../api/client.js');
      await inspectionApi.get('test-id');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/api/inspections/test-id',
        expect.any(Object)
      );
    });

    it('should default to localhost:3000 when API_URL not set', async () => {
      delete process.env.API_URL;
      delete process.env.SERVICE_API_KEY;

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ id: '123' }),
      });
      global.fetch = mockFetch;

      const { inspectionApi } = await import('../api/client.js');
      await inspectionApi.get('test-id');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/inspections/test-id',
        expect.any(Object)
      );
    });
  });
});
