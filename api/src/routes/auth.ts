/**
 * Auth Routes — Issue #41
 *
 * Login endpoint with rate limiting.
 */

import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { generateToken, verifyPassword } from '../middleware/auth.js';
import { cookieDomain } from '../config/domain.js';

const AUTH_PASSWORD = process.env.AUTH_PASSWORD;

export const authRouter = Router();

// Rate limiting: stricter in production, relaxed for test environment
const isTestEnv = process.env.NODE_ENV === 'test';
const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: isTestEnv ? 100 : 5, // 100 attempts in test, 5 in production
  message: { error: 'Too many login attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation schema
const LoginSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

/**
 * POST /api/auth/login
 * Authenticate with password, returns JWT token in HttpOnly cookie
 */
authRouter.post('/login', loginLimiter, async (req: Request, res: Response) => {
  try {
    // Validate input
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const { password } = parsed.data;

    // Check if auth is configured
    if (!AUTH_PASSWORD) {
      // No password configured = auth disabled (development mode)
      const token = generateToken('user');
      setTokenCookie(res, token);
      res.json({ token, message: 'Auth disabled - development mode' });
      return;
    }

    // Verify password
    const isValid = await verifyPassword(password, AUTH_PASSWORD);
    if (!isValid) {
      res.status(401).json({ error: 'Invalid password' });
      return;
    }

    // Generate token
    const token = generateToken('user');

    // Set HttpOnly cookie
    setTokenCookie(res, token);

    res.json({ token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

/**
 * POST /api/auth/logout
 * Clear the auth cookie
 */
authRouter.post('/logout', (req: Request, res: Response) => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  const clearOptions: {
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'strict' | 'lax' | 'none';
    domain?: string;
  } = {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
  };

  if (cookieDomain) {
    clearOptions.domain = cookieDomain;
  }

  res.clearCookie('token', clearOptions);
  res.json({ message: 'Logged out' });
});

/**
 * GET /api/auth/check
 * Check if current request is authenticated (for client-side checks)
 */
authRouter.get('/check', (req: Request, res: Response) => {
  const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    res.json({ authenticated: false });
    return;
  }

  try {
    const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-min-32-chars!!';
    jwt.verify(token, JWT_SECRET);
    res.json({ authenticated: true });
  } catch {
    res.json({ authenticated: false });
  }
});

function setTokenCookie(res: Response, token: string): void {
  const isProduction = process.env.NODE_ENV === 'production';
  
  const cookieOptions: {
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'strict' | 'lax' | 'none';
    maxAge: number;
    domain?: string;
  } = {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',  // Same-site with custom domains
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  };

  // Set domain for cross-subdomain cookies (from APP_DOMAIN)
  if (cookieDomain) {
    cookieOptions.domain = cookieDomain;
  }

  res.cookie('token', token, cookieOptions);
}
