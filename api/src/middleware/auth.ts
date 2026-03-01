/**
 * Auth Middleware — Issue #41, #595
 *
 * JWT-based authentication + DB-backed scoped service key auth.
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { logger } from '../lib/logger.js';

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-min-32-chars!!';

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  userId?: string;
  serviceActor?: string;
  serviceScopes?: string[];
  isServiceAuth?: boolean;
}

/**
 * Verify JWT token from cookie or Authorization header
 */
export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const cookieToken = req.cookies?.token;
  const headerToken = req.headers.authorization?.replace('Bearer ', '');
  const token = cookieToken || headerToken;

  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { sub: string };
    req.userId = decoded.sub;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Generate JWT token
 */
export function generateToken(userId: string): string {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: '24h' });
}

/**
 * Service authentication middleware — Issue #351, #595
 *
 * Allows either:
 * 1. DB-backed scoped API key (X-API-Key header, prefix lookup + bcrypt)
 * 2. Legacy SERVICE_API_KEY env var (backward compat)
 * 3. JWT token (cookie or Authorization header)
 */
export async function serviceAuthMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const apiKey = req.headers['x-api-key'] as string | undefined;

  if (apiKey) {
    // Try DB-backed key lookup first
    const prefix = apiKey.slice(0, 8);
    try {
      const serviceKey = await prisma.serviceKey.findFirst({
        where: { keyPrefix: prefix },
      });

      if (serviceKey) {
        // Check active
        if (!serviceKey.active) {
          res.status(401).json({ error: 'API key is inactive' });
          return;
        }

        // Check expiry
        if (serviceKey.expiresAt && serviceKey.expiresAt < new Date()) {
          res.status(401).json({ error: 'API key expired' });
          return;
        }

        // Bcrypt compare
        const valid = await bcrypt.compare(apiKey, serviceKey.keyHash);
        if (valid) {
          req.userId = `service:${serviceKey.name}`;
          req.serviceActor = serviceKey.actor;
          req.serviceScopes = serviceKey.scopes;
          req.isServiceAuth = true;

          // Update lastUsedAt (fire-and-forget)
          prisma.serviceKey.update({
            where: { id: serviceKey.id },
            data: { lastUsedAt: new Date() },
          }).catch((err) => {
            logger.warn({ err, keyId: serviceKey.id }, 'Failed to update lastUsedAt');
          });

          next();
          return;
        }
      }
    } catch (err) {
      // DB error — fall through to legacy check
      logger.warn({ err }, 'Service key DB lookup failed, trying legacy');
    }

    // Legacy fallback: SERVICE_API_KEY env var
    const expectedApiKey = process.env.SERVICE_API_KEY;
    if (expectedApiKey && apiKey === expectedApiKey) {
      req.userId = 'service';
      req.isServiceAuth = true;
      next();
      return;
    }
  }

  // Fall back to JWT auth
  const cookieToken = req.cookies?.token;
  const headerToken = req.headers.authorization?.replace('Bearer ', '');
  const token = cookieToken || headerToken;

  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { sub: string };
    req.userId = decoded.sub;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Scope check middleware factory — Issue #595
 *
 * Returns middleware that checks if the service key has the required scope.
 * JWT users bypass scope checks (they have full access via session).
 * Supports wildcard scopes: "inspections:*" matches "inspections:read".
 */
export function requireScope(scope: string) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    // JWT users bypass scope checks
    if (!req.isServiceAuth) {
      next();
      return;
    }

    // Legacy service auth (no scopes) — allow for backward compat
    if (!req.serviceScopes) {
      next();
      return;
    }

    const [resource, action] = scope.split(':');
    const hasScope = req.serviceScopes.some((s) => {
      if (s === scope) return true;
      // Wildcard: "inspections:*" matches "inspections:read"
      const [sResource, sAction] = s.split(':');
      return sResource === resource && sAction === '*';
    });

    if (!hasScope) {
      res.status(403).json({
        error: 'Insufficient scope',
        required: scope,
        actor: req.serviceActor,
      });
      return;
    }

    next();
  };
}

/**
 * Require admin role for protected endpoints
 */
export function requireAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.userId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const adminUsers = (process.env.ADMIN_USER_IDS || '').split(',').filter(Boolean);

  if (adminUsers.length > 0 && !adminUsers.includes(req.userId)) {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }

  next();
}

/**
 * Verify password against stored hash
 */
export async function verifyPassword(
  password: string,
  expectedPassword: string
): Promise<boolean> {
  if (expectedPassword.startsWith('$2')) {
    return bcrypt.compare(password, expectedPassword);
  }

  const crypto = await import('crypto');
  if (password.length !== expectedPassword.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(password),
    Buffer.from(expectedPassword)
  );
}
