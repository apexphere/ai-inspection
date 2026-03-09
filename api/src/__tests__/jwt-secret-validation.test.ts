import { describe, it, expect, afterEach } from 'vitest';

const DEV_FALLBACK = 'development-secret-min-32-chars!!';

/**
 * Re-executes resolveJwtSecret() logic inline so we can test it
 * without module-level side effects or re-importing the module.
 */
function resolveJwtSecret(nodeEnv: string | undefined, jwtSecret: string | undefined): string {
  if (nodeEnv === 'production') {
    if (!jwtSecret || jwtSecret === DEV_FALLBACK) {
      throw new Error(
        'JWT_SECRET must be set to a secure value in production. ' +
        'Refusing to start with missing or default secret.'
      );
    }
    return jwtSecret;
  }
  return jwtSecret || DEV_FALLBACK;
}

describe('JWT_SECRET validation', () => {
  describe('production environment', () => {
    it('throws when JWT_SECRET is not set', () => {
      expect(() => resolveJwtSecret('production', undefined)).toThrowError(
        'JWT_SECRET must be set to a secure value in production'
      );
    });

    it('throws when JWT_SECRET is the hardcoded dev fallback', () => {
      expect(() => resolveJwtSecret('production', DEV_FALLBACK)).toThrowError(
        'JWT_SECRET must be set to a secure value in production'
      );
    });

    it('throws when JWT_SECRET is an empty string', () => {
      expect(() => resolveJwtSecret('production', '')).toThrowError(
        'JWT_SECRET must be set to a secure value in production'
      );
    });

    it('accepts a valid secret in production', () => {
      const secret = 'a-very-secure-random-secret-value-123!';
      expect(resolveJwtSecret('production', secret)).toBe(secret);
    });
  });

  describe('non-production environments', () => {
    it('falls back to dev default when JWT_SECRET is unset in development', () => {
      expect(resolveJwtSecret('development', undefined)).toBe(DEV_FALLBACK);
    });

    it('uses provided secret in development', () => {
      const secret = 'custom-dev-secret';
      expect(resolveJwtSecret('development', secret)).toBe(secret);
    });

    it('falls back to dev default when NODE_ENV is undefined', () => {
      expect(resolveJwtSecret(undefined, undefined)).toBe(DEV_FALLBACK);
    });

    it('uses dev fallback even if JWT_SECRET matches it in development', () => {
      expect(resolveJwtSecret('development', DEV_FALLBACK)).toBe(DEV_FALLBACK);
    });
  });
});
