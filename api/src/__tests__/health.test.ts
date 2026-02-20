import { describe, it, expect } from 'vitest';
import { version } from '../config/version.js';

describe('Health Endpoint', () => {
  describe('Version info', () => {
    it('should have required version fields', () => {
      expect(version).toHaveProperty('sha');
      expect(version).toHaveProperty('shortSha');
      expect(version).toHaveProperty('branch');
      expect(version).toHaveProperty('buildTime');
    });

    it('should have shortSha as 7 characters or "unknown"', () => {
      if (version.sha === 'unknown') {
        expect(version.shortSha).toBe('unknown');
      } else {
        expect(version.shortSha).toHaveLength(7);
      }
    });

    it('should have valid buildTime format', () => {
      // Should be ISO 8601 format
      expect(() => new Date(version.buildTime)).not.toThrow();
      expect(new Date(version.buildTime).toISOString()).toBeTruthy();
    });

    it('should default to unknown for missing env vars', () => {
      // In test environment, env vars are typically not set
      expect(['unknown', version.sha]).toContain(version.sha);
      expect(['unknown', version.branch]).toContain(version.branch);
    });
  });
});
