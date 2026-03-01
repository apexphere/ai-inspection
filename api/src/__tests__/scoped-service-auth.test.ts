/**
 * Scoped Service Auth Tests — Issue #595
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Response, NextFunction } from 'express';
import { requireScope, type AuthRequest } from '../middleware/auth.js';

function mockReq(overrides: Partial<AuthRequest> = {}): AuthRequest {
  return {
    headers: {},
    cookies: {},
    ...overrides,
  } as AuthRequest;
}

function mockRes(): Response {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

describe('requireScope — #595', () => {
  let next: NextFunction;

  beforeEach(() => {
    next = vi.fn();
  });

  it('allows JWT users without scope check', () => {
    const req = mockReq({ userId: 'user-123', isServiceAuth: false });
    const res = mockRes();

    requireScope('inspections:write')(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('allows legacy service auth (no scopes defined)', () => {
    const req = mockReq({
      userId: 'service',
      isServiceAuth: true,
      serviceScopes: undefined,
    });
    const res = mockRes();

    requireScope('inspections:write')(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('allows service key with exact matching scope', () => {
    const req = mockReq({
      userId: 'service:kai',
      isServiceAuth: true,
      serviceScopes: ['inspections:read', 'inspections:write'],
      serviceActor: 'agent:kai',
    });
    const res = mockRes();

    requireScope('inspections:write')(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('allows service key with wildcard scope', () => {
    const req = mockReq({
      userId: 'service:kai',
      isServiceAuth: true,
      serviceScopes: ['inspections:*'],
      serviceActor: 'agent:kai',
    });
    const res = mockRes();

    requireScope('inspections:read')(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('rejects service key missing required scope', () => {
    const req = mockReq({
      userId: 'service:kai',
      isServiceAuth: true,
      serviceScopes: ['inspections:read'],
      serviceActor: 'agent:kai',
    });
    const res = mockRes();

    requireScope('personnel:write')(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Insufficient scope',
        required: 'personnel:write',
        actor: 'agent:kai',
      }),
    );
  });

  it('rejects service key with wrong resource wildcard', () => {
    const req = mockReq({
      userId: 'service:kai',
      isServiceAuth: true,
      serviceScopes: ['projects:*'],
      serviceActor: 'agent:kai',
    });
    const res = mockRes();

    requireScope('inspections:read')(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('handles empty scopes array', () => {
    const req = mockReq({
      userId: 'service:kai',
      isServiceAuth: true,
      serviceScopes: [],
      serviceActor: 'agent:kai',
    });
    const res = mockRes();

    requireScope('inspections:read')(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });
});
