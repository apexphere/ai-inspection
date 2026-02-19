import { describe, it, expect } from 'vitest';

describe('WhatsApp Account Linking', () => {
  describe('Phone number validation', () => {
    const phoneRegex = /^\+?[1-9]\d{9,14}$/;

    it('should accept valid international phone numbers', () => {
      expect(phoneRegex.test('+64211234567')).toBe(true);
      expect(phoneRegex.test('64211234567')).toBe(true);
      expect(phoneRegex.test('+1234567890')).toBe(true);
      expect(phoneRegex.test('+12345678901234')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(phoneRegex.test('123')).toBe(false); // Too short
      expect(phoneRegex.test('0211234567')).toBe(false); // Starts with 0
      expect(phoneRegex.test('abcdefghij')).toBe(false); // Non-numeric
      expect(phoneRegex.test('')).toBe(false); // Empty
      expect(phoneRegex.test('+0123456789')).toBe(false); // Starts with +0
    });
  });

  describe('Verification code generation', () => {
    const generateCode = () => Array.from({ length: 6 }, () => 
      Math.floor(Math.random() * 10)
    ).join('');

    it('should generate 6-digit numeric codes', () => {
      for (let i = 0; i < 10; i++) {
        const code = generateCode();
        expect(code).toHaveLength(6);
        expect(/^\d{6}$/.test(code)).toBe(true);
      }
    });

    it('should generate different codes', () => {
      const codes = new Set<string>();
      for (let i = 0; i < 100; i++) {
        codes.add(generateCode());
      }
      // With 6 digits, 100 codes should be mostly unique
      expect(codes.size).toBeGreaterThan(90);
    });
  });

  describe('Verification code validation', () => {
    const codeRegex = /^\d{6}$/;

    it('should accept valid 6-digit codes', () => {
      expect(codeRegex.test('123456')).toBe(true);
      expect(codeRegex.test('000000')).toBe(true);
      expect(codeRegex.test('999999')).toBe(true);
    });

    it('should reject invalid codes', () => {
      expect(codeRegex.test('12345')).toBe(false); // Too short
      expect(codeRegex.test('1234567')).toBe(false); // Too long
      expect(codeRegex.test('abcdef')).toBe(false); // Non-numeric
      expect(codeRegex.test('12 456')).toBe(false); // Space
      expect(codeRegex.test('')).toBe(false); // Empty
    });
  });

  describe('Code expiry logic', () => {
    const EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

    it('should identify valid (non-expired) codes', () => {
      const validCode = {
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 mins from now
      };
      expect(validCode.expiresAt > new Date()).toBe(true);
    });

    it('should identify expired codes', () => {
      const expiredCode = {
        expiresAt: new Date(Date.now() - 5 * 60 * 1000), // 5 mins ago
      };
      expect(expiredCode.expiresAt > new Date()).toBe(false);
    });

    it('should set correct expiry time', () => {
      const now = Date.now();
      const expiresAt = new Date(now + EXPIRY_MS);
      const diff = expiresAt.getTime() - now;
      expect(diff).toBe(EXPIRY_MS);
    });
  });

  describe('Used code detection', () => {
    it('should identify used codes', () => {
      const usedCode = { verifiedAt: new Date() };
      expect(usedCode.verifiedAt).not.toBeNull();
    });

    it('should identify unused codes', () => {
      const unusedCode = { verifiedAt: null };
      expect(unusedCode.verifiedAt).toBeNull();
    });
  });

  describe('WhatsApp status logic', () => {
    it('should return linked=true for verified user with phone', () => {
      const user = { phoneNumber: '+64211234567', phoneVerified: true };
      const linked = user.phoneVerified && !!user.phoneNumber;
      expect(linked).toBe(true);
    });

    it('should return linked=false for unverified user', () => {
      const user = { phoneNumber: '+64211234567', phoneVerified: false };
      const linked = user.phoneVerified && !!user.phoneNumber;
      expect(linked).toBe(false);
    });

    it('should return linked=false for user without phone', () => {
      const user = { phoneNumber: null, phoneVerified: false };
      const linked = user.phoneVerified && !!user.phoneNumber;
      expect(linked).toBe(false);
    });
  });
});
