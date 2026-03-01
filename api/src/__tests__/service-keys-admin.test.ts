/**
 * Service Keys Admin Routes — Issue #597
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express, { type Response, type NextFunction } from 'express';
import type { ServiceKey } from '@prisma/client';
import { requireAdmin, type AuthRequest } from '../middleware/auth.js';
import { createServiceKeysAdminRouter } from '../routes/admin/service-keys.js';

function createTestApp(serviceMock: {
  create: (input: any) => Promise<ServiceKey>;
  list: () => Promise<Omit<ServiceKey, 'keyHash'>[]>;
  deactivate: (id: string) => Promise<ServiceKey>;
}) {
  const app = express();
  app.use(express.json());

  // Fake auth: set userId from header
  app.use((req: AuthRequest, _res: Response, next: NextFunction) => {
    req.userId = req.headers['x-user-id'] as string | undefined;
    next();
  });

  app.use(requireAdmin);
  app.use('/api/admin/service-keys', createServiceKeysAdminRouter(serviceMock as any));
  return app;
}

describe('Service Keys Admin Routes — #597', () => {
  const adminId = 'admin-1';
  const nonAdminId = 'user-2';

  beforeEach(() => {
    process.env.ADMIN_USER_IDS = adminId;
  });

  afterEach(() => {
    delete process.env.ADMIN_USER_IDS;
  });

  it('rejects non-admin users', async () => {
    const serviceMock = {
      create: vi.fn(),
      list: vi.fn(),
      deactivate: vi.fn(),
    };
    const app = createTestApp(serviceMock);

    const res = await request(app)
      .post('/api/admin/service-keys')
      .set('x-user-id', nonAdminId)
      .send({ name: 'kai', actor: 'agent:kai', scopes: ['projects:read'] });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Admin access required');
  });

  it('creates a service key and returns plaintext once', async () => {
    const created: ServiceKey = {
      id: 'key-1',
      name: 'kai',
      keyHash: 'hash',
      keyPrefix: 'sk_abc12',
      scopes: ['projects:read'],
      actor: 'agent:kai',
      active: true,
      expiresAt: null,
      lastUsedAt: null,
      createdAt: new Date('2026-03-01T00:00:00Z'),
      updatedAt: new Date('2026-03-01T00:00:00Z'),
    };

    const serviceMock = {
      create: vi.fn().mockResolvedValue(created),
      list: vi.fn(),
      deactivate: vi.fn(),
    };

    const app = createTestApp(serviceMock);

    const res = await request(app)
      .post('/api/admin/service-keys')
      .set('x-user-id', adminId)
      .send({ name: 'kai', actor: 'agent:kai', scopes: ['projects:read'] });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('key');
    expect(res.body.key).toMatch(/^sk_/);
    expect(res.body.keyPrefix).toHaveLength(8);
    expect(res.body.name).toBe('kai');

  });

  it('lists service keys without keyHash', async () => {
    const listData = [
      {
        id: 'key-1',
        name: 'kai',
        keyPrefix: 'sk_abc12',
        scopes: ['projects:read'],
        actor: 'agent:kai',
        active: true,
        expiresAt: null,
        lastUsedAt: null,
        createdAt: new Date('2026-03-01T00:00:00Z'),
        updatedAt: new Date('2026-03-01T00:00:00Z'),
      },
    ];

    const serviceMock = {
      create: vi.fn(),
      list: vi.fn().mockResolvedValue(listData as any),
      deactivate: vi.fn(),
    };

    const app = createTestApp(serviceMock);

    const res = await request(app)
      .get('/api/admin/service-keys')
      .set('x-user-id', adminId);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).not.toHaveProperty('keyHash');
  });

  it('deactivates a service key', async () => {
    const updated: ServiceKey = {
      id: 'key-1',
      name: 'kai',
      keyHash: 'hash',
      keyPrefix: 'sk_abc12',
      scopes: ['projects:read'],
      actor: 'agent:kai',
      active: false,
      expiresAt: null,
      lastUsedAt: null,
      createdAt: new Date('2026-03-01T00:00:00Z'),
      updatedAt: new Date('2026-03-01T00:00:00Z'),
    };

    const serviceMock = {
      create: vi.fn(),
      list: vi.fn(),
      deactivate: vi.fn().mockResolvedValue(updated),
    };

    const app = createTestApp(serviceMock);

    const res = await request(app)
      .delete('/api/admin/service-keys/key-1')
      .set('x-user-id', adminId);

    expect(res.status).toBe(200);
    expect(res.body.active).toBe(false);
  });
});
