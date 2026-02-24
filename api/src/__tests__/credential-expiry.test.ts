/**
 * Credential Expiry Alert Tests — Issue #202
 */

import { describe, it, expect } from 'vitest';
import { getAlertLevel, daysUntilDate } from '../services/credential-expiry.js';

describe('credential-expiry', () => {
  describe('getAlertLevel', () => {
    it('returns EXPIRED for 0 or negative days', () => {
      expect(getAlertLevel(0)).toBe('EXPIRED');
      expect(getAlertLevel(-5)).toBe('EXPIRED');
      expect(getAlertLevel(-100)).toBe('EXPIRED');
    });

    it('returns URGENT for 1-30 days', () => {
      expect(getAlertLevel(1)).toBe('URGENT');
      expect(getAlertLevel(15)).toBe('URGENT');
      expect(getAlertLevel(30)).toBe('URGENT');
    });

    it('returns WARNING for 31-60 days', () => {
      expect(getAlertLevel(31)).toBe('WARNING');
      expect(getAlertLevel(45)).toBe('WARNING');
      expect(getAlertLevel(60)).toBe('WARNING');
    });

    it('returns INFO for 61+ days', () => {
      expect(getAlertLevel(61)).toBe('INFO');
      expect(getAlertLevel(90)).toBe('INFO');
      expect(getAlertLevel(365)).toBe('INFO');
    });
  });

  describe('daysUntilDate', () => {
    it('returns positive days for future date', () => {
      const now = new Date('2026-02-25T00:00:00Z');
      const expiry = new Date('2026-03-27T00:00:00Z');
      expect(daysUntilDate(expiry, now)).toBe(30);
    });

    it('returns 0 for same day', () => {
      const now = new Date('2026-02-25T00:00:00Z');
      const expiry = new Date('2026-02-25T00:00:00Z');
      expect(daysUntilDate(expiry, now)).toBe(0);
    });

    it('returns negative days for past date', () => {
      const now = new Date('2026-02-25T00:00:00Z');
      const expiry = new Date('2026-02-15T00:00:00Z');
      expect(daysUntilDate(expiry, now)).toBe(-10);
    });

    it('floors partial days', () => {
      const now = new Date('2026-02-25T12:00:00Z');
      const expiry = new Date('2026-02-26T06:00:00Z');
      // 18 hours = 0 full days
      expect(daysUntilDate(expiry, now)).toBe(0);
    });
  });
});
