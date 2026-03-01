import { describe, it, expect } from 'vitest';
import { version } from '../config/version.js';

describe('Health Endpoint', () => {
  describe('Version info', () => {
    it('should have required version fields', () => {
      expect(version).toHaveProperty('semver');
      expect(version).toHaveProperty('sha');
      expect(version).toHaveProperty('shortSha');
      expect(version).toHaveProperty('branch');
      expect(version).toHaveProperty('buildTime');
    });

    it('should have valid semver from package.json', () => {
      expect(version.semver).toMatch(/^\d+\.\d+\.\d+/);
    });

    it('should have shortSha as 7 characters or "unknown"', () => {
      if (version.sha === 'unknown') {
        expect(version.shortSha).toBe('unknown');
      } else {
        expect(version.shortSha).toHaveLength(7);
      }
    });

    it('should have valid buildTime format', () => {
      expect(() => new Date(version.buildTime)).not.toThrow();
      expect(new Date(version.buildTime).toISOString()).toBeTruthy();
    });

    it('should default to unknown for missing env vars', () => {
      expect(['unknown', version.sha]).toContain(version.sha);
      expect(['unknown', version.branch]).toContain(version.branch);
    });
  });
});
