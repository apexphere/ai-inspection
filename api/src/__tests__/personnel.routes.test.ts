/**
 * Personnel Routes Tests
 *
 * HTTP-level tests for query param validation on the personnel endpoints.
 */

import { describe, it, expect, vi } from 'vitest';
import express from 'express';
import request from 'supertest';

// Mock PrismaClient before importing the router
vi.mock('@prisma/client', () => {
  return {
    PrismaClient: class {
      personnel = {
        findMany: vi.fn().mockResolvedValue([]),
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      };
      $connect = vi.fn();
      $disconnect = vi.fn();
    },
  };
});

// Import router after mocks
const { personnelRouter } = await import('../routes/personnel.js');

const app = express();
app.use(express.json());
app.use('/api/personnel', personnelRouter);

describe('GET /api/personnel', () => {
  it('returns 400 for invalid ?role= query param', async () => {
    const res = await request(app).get('/api/personnel?role=INVALID');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid role/i);
    expect(res.body.error).toContain('REGISTERED_BUILDING_SURVEYOR');
  });

  it('returns 200 for valid ?role= query param', async () => {
    const res = await request(app).get('/api/personnel?role=INSPECTOR');
    expect(res.status).toBe(200);
  });

  it('returns 200 with no filters', async () => {
    const res = await request(app).get('/api/personnel');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
