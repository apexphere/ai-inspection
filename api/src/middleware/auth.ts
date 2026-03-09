/**
 * Auth Middleware — Issue #41
 *
 * ## Middleware selection rule
 *
 * Use `authMiddleware` for user-facing routes (web UI).
 *   - Accepts: JWT token (cookie or Authorization header)
 *   - Caller: browser / web UI
 *   - Sets: req.userId = <user id from JWT>
 *
 * Use `serviceAuthMiddleware` for service-to-service routes (agent / OpenClaw).
 *   - Accepts: X-API-Key header (preferred) OR JWT token (fallback)
 *   - Caller: OpenClaw agent, MCP server, internal services
 *   - Sets: req.userId = 'service' (API key path) or <user id> (JWT path)
 *   - Note: JWT callers via this middleware bypass API-key scope checks —
 *     there are currently no scoped permissions, but keep this in mind
 *     when scoped auth is added (see issue #577).
 *
 * Do not mix them on the same route. If unsure, prefer `authMiddleware`
 * for user routes and only use `serviceAuthMiddleware` where an agent
 * or automated service explicitly needs API-key access.
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-min-32-chars!!';

export interface AuthRequest extends Request {
  userId?: string;
}

/**
 * User-facing auth middleware.
 * Use on routes called by the web UI. Accepts JWT only.
 * See module-level comment for selection rule.
 */
export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  // Get token from cookie or Authorization header
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
 * Service-to-service auth middleware.
 * Use on routes called by the OpenClaw agent or internal services.
 * Accepts X-API-Key (sets userId='service') or JWT (sets userId from token).
 * See module-level comment for selection rule and JWT bypass note.
 */
export function serviceAuthMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  // Check for API key first (service-to-service auth)
  const apiKey = req.headers['x-api-key'];
  const expectedApiKey = process.env.SERVICE_API_KEY;

  if (apiKey && expectedApiKey && apiKey === expectedApiKey) {
    // Service auth successful - no userId needed
    req.userId = 'service';
    next();
    return;
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
 * Require admin role for protected endpoints
 * For now, admins are identified by checking personnel role
 */
export function requireAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  // Check if user is authenticated
  if (!req.userId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  // For MVP: Check if user ID is in admin list (env var)
  // In production: Look up user's personnel role
  const adminUsers = (process.env.ADMIN_USER_IDS || '').split(',').filter(Boolean);
  
  if (adminUsers.length > 0 && !adminUsers.includes(req.userId)) {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }

  // If no admin list configured, allow access (development mode)
  next();
}

/**
 * Verify password against stored hash
 */
export async function verifyPassword(
  password: string,
  expectedPassword: string
): Promise<boolean> {
  // For MVP, we use plain text comparison from env var
  // In production, use bcrypt.compare with hashed password
  const bcrypt = await import('bcryptjs');
  
  // If AUTH_PASSWORD is already hashed (starts with $2), use bcrypt compare
  if (expectedPassword.startsWith('$2')) {
    return bcrypt.compare(password, expectedPassword);
  }
  
  // Otherwise, do constant-time comparison for plain text (MVP mode)
  const crypto = await import('crypto');
  
  // timingSafeEqual requires same-length buffers
  if (password.length !== expectedPassword.length) {
    return false;
  }
  
  return crypto.timingSafeEqual(
    Buffer.from(password),
    Buffer.from(expectedPassword)
  );
}
