/**
 * Auth Middleware — Issue #41
 *
 * JWT-based authentication middleware.
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-min-32-chars!!';

export interface AuthRequest extends Request {
  userId?: string;
}

/**
 * Verify JWT token from cookie or Authorization header
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
  } catch (err) {
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
  return crypto.timingSafeEqual(
    Buffer.from(password),
    Buffer.from(expectedPassword)
  );
}
