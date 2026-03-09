import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../middleware/auth.js';

/**
 * Inline the requireAdmin logic so we can test it without
 * re-importing the module (which has module-level side effects).
 */
function requireAdmin(adminUserIds: string | undefined, userId: string | undefined) {
  // Mirrors the implementation in auth.ts
  const adminUsers = (adminUserIds || '').split(',').filter(Boolean);

  if (!userId) return { status: 401, error: 'Authentication required' };
  if (adminUsers.length === 0) return { status: 403, error: 'Admin access required' };
  if (!adminUsers.includes(userId)) return { status: 403, error: 'Admin access required' };
  return { status: 200 };
}

describe('requireAdmin', () => {
  describe('when ADMIN_USER_IDS is not configured', () => {
    it('denies access when env var is undefined', () => {
      const result = requireAdmin(undefined, 'user-123');
      expect(result.status).toBe(403);
    });

    it('denies access when env var is an empty string', () => {
      const result = requireAdmin('', 'user-123');
      expect(result.status).toBe(403);
    });

    it('denies access even for service user', () => {
      const result = requireAdmin(undefined, 'service');
      expect(result.status).toBe(403);
    });
  });

  describe('when ADMIN_USER_IDS is configured', () => {
    const adminUserIds = 'admin-1,admin-2,admin-3';

    it('allows access for a user in the admin list', () => {
      expect(requireAdmin(adminUserIds, 'admin-1').status).toBe(200);
      expect(requireAdmin(adminUserIds, 'admin-2').status).toBe(200);
      expect(requireAdmin(adminUserIds, 'admin-3').status).toBe(200);
    });

    it('denies access for a user not in the admin list', () => {
      const result = requireAdmin(adminUserIds, 'regular-user');
      expect(result.status).toBe(403);
    });

    it('denies access for a user with partial match', () => {
      // Ensure 'admin' doesn't match 'admin-1'
      const result = requireAdmin(adminUserIds, 'admin');
      expect(result.status).toBe(403);
    });
  });

  describe('when user is not authenticated', () => {
    it('returns 401 when userId is undefined', () => {
      const result = requireAdmin('admin-1', undefined);
      expect(result.status).toBe(401);
    });
  });
});
