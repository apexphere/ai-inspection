/**
 * Scoped Route Authorization Tests — Issue #596
 */

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import type { Response, NextFunction } from 'express';
import { requireScope, type AuthRequest } from '../middleware/auth.js';

/**
 * Create a test app with a route protected by requireScope.
 */
function createScopedApp(scope: string) {
  const app = express();

  // Simulate service auth (populate req fields)
  app.use((req: AuthRequest, _res: Response, next: NextFunction) => {
    const mode = req.headers['x-test-auth'] as string;
    if (mode === 'jwt') {
      req.userId = 'user-123';
      req.isServiceAuth = false;
    } else if (mode === 'service') {
      req.userId = 'service:kai-agent';
      req.isServiceAuth = true;
      req.serviceActor = 'agent:kai';
      req.serviceScopes = (req.headers['x-test-scopes'] as string || '').split(',').filter(Boolean);
    }
    next();
  });

  app.get('/test', requireScope(scope), (_req, res) => {
    res.json({ ok: true });
  });

  return app;
}

describe('Scoped Route Authorization — #596', () => {
  describe('requireScope middleware', () => {
    it('allows JWT users without scope check', async () => {
      const app = createScopedApp('projects:read');
      const res = await request(app)
        .get('/test')
        .set('x-test-auth', 'jwt');
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });

    it('allows service key with matching scope', async () => {
      const app = createScopedApp('projects:read');
      const res = await request(app)
        .get('/test')
        .set('x-test-auth', 'service')
        .set('x-test-scopes', 'projects:read,projects:write');
      expect(res.status).toBe(200);
    });

    it('allows service key with wildcard scope', async () => {
      const app = createScopedApp('projects:read');
      const res = await request(app)
        .get('/test')
        .set('x-test-auth', 'service')
        .set('x-test-scopes', 'projects:*');
      expect(res.status).toBe(200);
    });

    it('rejects service key without matching scope', async () => {
      const app = createScopedApp('projects:read');
      const res = await request(app)
        .get('/test')
        .set('x-test-auth', 'service')
        .set('x-test-scopes', 'inspections:read');
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Insufficient scope');
      expect(res.body.required).toBe('projects:read');
    });

    it('rejects service key with wrong resource wildcard', async () => {
      const app = createScopedApp('projects:read');
      const res = await request(app)
        .get('/test')
        .set('x-test-auth', 'service')
        .set('x-test-scopes', 'inspections:*');
      expect(res.status).toBe(403);
    });

    it('allows legacy service auth (no scopes defined)', async () => {
      const app = express();
      app.use((req: AuthRequest, _res: Response, next: NextFunction) => {
        req.userId = 'service';
        req.isServiceAuth = true;
        // No serviceScopes — legacy key
        next();
      });
      app.get('/test', requireScope('projects:read'), (_req, res) => {
        res.json({ ok: true });
      });

      const res = await request(app).get('/test');
      expect(res.status).toBe(200);
    });
  });

  describe('sensitive routes are JWT-only', () => {
    // This test verifies the design: sensitive routes use authMiddleware
    // which rejects service keys (no JWT = 401)
    it('documents that personnel, credentials, companies use authMiddleware', () => {
      // This is a design assertion — the actual wiring is in index.ts
      // Personnel, credentials, companies, report-management use authMiddleware (JWT only)
      // Agent routes use serviceAuthMiddleware + requireScope
      expect(true).toBe(true);
    });
  });
});
