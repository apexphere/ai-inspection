/**
 * Service Key Tests — Issue #594
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import bcrypt from 'bcrypt';
import {
  ServiceKeyService,
  DuplicateKeyNameError,
} from '../services/service-key.js';

// Mock Prisma client
function createMockPrisma() {
  const keys: Record<string, any> = {};

  return {
    serviceKey: {
      findUnique: vi.fn(async ({ where }: any) => {
        if (where.name) return keys[where.name] ?? null;
        return null;
      }),
      findFirst: vi.fn(async ({ where }: any) => {
        return Object.values(keys).find(
          (k: any) => k.keyPrefix === where.keyPrefix && k.active
        ) ?? null;
      }),
      findMany: vi.fn(async () => Object.values(keys)),
      create: vi.fn(async ({ data }: any) => {
        const key = { id: `id-${data.name}`, active: true, expiresAt: null, lastUsedAt: null, ...data, createdAt: new Date(), updatedAt: new Date() };
        keys[data.name] = key;
        return key;
      }),
      update: vi.fn(async ({ where, data }: any) => {
        const key = Object.values(keys).find((k: any) => k.id === where.id) as any;
        if (key) Object.assign(key, data, { updatedAt: new Date() });
        return key;
      }),
    },
    _keys: keys,
  };
}

describe('ServiceKeyService — #594', () => {
  let prisma: ReturnType<typeof createMockPrisma>;
  let svc: ServiceKeyService;

  beforeEach(() => {
    prisma = createMockPrisma();
    svc = new ServiceKeyService(prisma as any);
  });

  describe('create', () => {
    it('creates a key with hashed value and prefix', async () => {
      const key = await svc.create({
        name: 'kai-agent',
        rawKey: 'sk_test_abcdefghijklmnop',
        scopes: ['inspections:*', 'photos:*'],
        actor: 'agent:kai',
      });

      expect(key.name).toBe('kai-agent');
      expect(key.keyPrefix).toBe('sk_test_');
      expect(key.scopes).toEqual(['inspections:*', 'photos:*']);
      expect(key.actor).toBe('agent:kai');
      expect(key.active).toBe(true);
      // Hash should be bcrypt format
      expect(key.keyHash).toMatch(/^\$2[aby]\$/);
    });

    it('throws DuplicateKeyNameError for duplicate names', async () => {
      await svc.create({
        name: 'kai-agent',
        rawKey: 'sk_test_abcdefghijklmnop',
        scopes: ['inspections:*'],
        actor: 'agent:kai',
      });

      await expect(
        svc.create({
          name: 'kai-agent',
          rawKey: 'sk_test_different',
          scopes: ['inspections:*'],
          actor: 'agent:kai',
        })
      ).rejects.toThrow(DuplicateKeyNameError);
    });
  });

  describe('verify', () => {
    it('returns true for matching key', async () => {
      const rawKey = 'sk_test_abcdefghijklmnop';
      const key = await svc.create({
        name: 'test-key',
        rawKey,
        scopes: ['inspections:read'],
        actor: 'test',
      });

      const result = await svc.verify(rawKey, key.keyHash);
      expect(result).toBe(true);
    });

    it('returns false for wrong key', async () => {
      const key = await svc.create({
        name: 'test-key',
        rawKey: 'sk_test_abcdefghijklmnop',
        scopes: ['inspections:read'],
        actor: 'test',
      });

      const result = await svc.verify('sk_test_wrongkey', key.keyHash);
      expect(result).toBe(false);
    });
  });

  describe('findByPrefix', () => {
    it('finds active key by prefix', async () => {
      await svc.create({
        name: 'kai-agent',
        rawKey: 'sk_test_abcdefghijklmnop',
        scopes: ['inspections:*'],
        actor: 'agent:kai',
      });

      const found = await svc.findByPrefix('sk_test_');
      expect(found).not.toBeNull();
      expect(found!.name).toBe('kai-agent');
    });
  });

  describe('list', () => {
    it('returns keys without keyHash', async () => {
      await svc.create({
        name: 'kai-agent',
        rawKey: 'sk_test_abcdefghijklmnop',
        scopes: ['inspections:*'],
        actor: 'agent:kai',
      });

      const keys = await svc.list();
      expect(keys).toHaveLength(1);
      expect(keys[0]).not.toHaveProperty('keyHash');
      expect(keys[0].name).toBe('kai-agent');
    });
  });

  describe('deactivate', () => {
    it('sets active to false', async () => {
      const key = await svc.create({
        name: 'kai-agent',
        rawKey: 'sk_test_abcdefghijklmnop',
        scopes: ['inspections:*'],
        actor: 'agent:kai',
      });

      await svc.deactivate(key.id);
      expect(prisma.serviceKey.update).toHaveBeenCalledWith({
        where: { id: key.id },
        data: { active: false },
      });
    });
  });
});
