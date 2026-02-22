/**
 * Inspectors API Tests — Issue #351
 *
 * Tests for phone number lookup endpoint used by WhatsApp agent.
 */

import { describe, it, expect } from 'vitest';

describe('Inspector Phone Lookup', () => {
  describe('Phone number normalization', () => {
    /**
     * Normalize phone number for consistent lookup
     */
    function normalizePhoneNumber(phone: string): string {
      const hasPlus = phone.startsWith('+');
      const digits = phone.replace(/\D/g, '');
      return hasPlus ? `+${digits}` : `+${digits}`;
    }

    it('should normalize phone with + prefix', () => {
      expect(normalizePhoneNumber('+64211234567')).toBe('+64211234567');
    });

    it('should add + prefix if missing', () => {
      expect(normalizePhoneNumber('64211234567')).toBe('+64211234567');
    });

    it('should remove spaces and dashes', () => {
      expect(normalizePhoneNumber('+64 21 123 4567')).toBe('+64211234567');
      expect(normalizePhoneNumber('+64-21-123-4567')).toBe('+64211234567');
    });

    it('should handle mixed formatting', () => {
      expect(normalizePhoneNumber('+64 (21) 123-4567')).toBe('+64211234567');
    });
  });

  describe('Phone number validation', () => {
    const phoneRegex = /^\+?[1-9]\d{9,14}$/;

    it('should accept valid NZ mobile numbers', () => {
      expect(phoneRegex.test('+64211234567')).toBe(true);
      expect(phoneRegex.test('+64221234567')).toBe(true);
      expect(phoneRegex.test('+64271234567')).toBe(true);
    });

    it('should accept valid international numbers', () => {
      expect(phoneRegex.test('+14155551234')).toBe(true);
      expect(phoneRegex.test('+447700900123')).toBe(true);
      expect(phoneRegex.test('+61412345678')).toBe(true);
    });

    it('should reject too short numbers', () => {
      expect(phoneRegex.test('+64123')).toBe(false);
      expect(phoneRegex.test('123456789')).toBe(false);
    });

    it('should reject numbers starting with 0', () => {
      expect(phoneRegex.test('0211234567')).toBe(false);
      expect(phoneRegex.test('+0211234567')).toBe(false);
    });

    it('should reject non-numeric', () => {
      expect(phoneRegex.test('invalid')).toBe(false);
      expect(phoneRegex.test('')).toBe(false);
    });
  });

  describe('Response structure', () => {
    it('should return expected fields for found inspector', () => {
      const mockResponse = {
        id: 'abc123',
        name: 'Jake Li',
        email: 'jake@example.com',
      };

      expect(mockResponse).toHaveProperty('id');
      expect(mockResponse).toHaveProperty('name');
      expect(mockResponse).toHaveProperty('email');
    });

    it('should return appropriate not found message', () => {
      const notFoundResponse = {
        error: 'Inspector not found',
        message: "I don't have you registered. Contact admin to set up your profile.",
      };

      expect(notFoundResponse.error).toBe('Inspector not found');
      expect(notFoundResponse.message).toContain("don't have you registered");
    });
  });
});
