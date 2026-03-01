/**
 * Auth isAdmin Tests — Issue #608
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const { mockUserFindUnique, mockUserUpdate } = vi.hoisted(() => ({
  mockUserFindUnique: vi.fn(),
  mockUserUpdate: vi.fn(),
}));

vi.mock('@prisma/client', () => ({
  PrismaClient: class {
    user = {
      findUnique: mockUserFindUnique,
      update: mockUserUpdate,
    };
  },
}));

vi.mock('bcrypt', () => ({
  default: { compare: vi.fn().mockResolvedValue(true) },
}));

vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn().mockReturnValue('mock-token'),
    verify: vi.fn().mockReturnValue({ sub: 'user-admin-1' }),
  },
}));

import request from 'supertest';
import express from 'express';
import { authRouter } from '../routes/auth.js';

const mockUser = {
  id: 'user-admin-1',
  email: 'admin@example.com',
  passwordHash: '$2b$10$hash',
  lastLoginAt: null,
};

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRouter);
  return app;
}

describe('Auth isAdmin — #608', () => {
  const app = createTestApp();

  beforeEach(() => {
    mockUserFindUnique.mockResolvedValue(mockUser);
    mockUserUpdate.mockResolvedValue(mockUser);
    delete process.env.ADMIN_USER_IDS;
  });

  afterEach(() => {
    delete process.env.ADMIN_USER_IDS;
  });

  it('returns isAdmin: true when userId is in ADMIN_USER_IDS', async () => {
    process.env.ADMIN_USER_IDS = 'user-admin-1,user-admin-2';

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'password' });

    expect(res.status).toBe(200);
    expect(res.body.user.isAdmin).toBe(true);
  });

  it('returns isAdmin: false when userId is NOT in ADMIN_USER_IDS', async () => {
    process.env.ADMIN_USER_IDS = 'other-user-id';

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'password' });

    expect(res.status).toBe(200);
    expect(res.body.user.isAdmin).toBe(false);
  });

  it('returns isAdmin: false when ADMIN_USER_IDS is not set', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'password' });

    expect(res.status).toBe(200);
    expect(res.body.user.isAdmin).toBe(false);
  });
});
