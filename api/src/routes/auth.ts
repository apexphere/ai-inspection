/**
 * Auth Routes — Issue #181
 *
 * User authentication with email/password.
 * Supports registration, login, logout, and session check.
 */

import { Router, Request, Response, type Router as RouterType } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { generateToken } from '../middleware/auth.js';
import { cookieDomain } from '../config/domain.js';

const prisma = new PrismaClient();

export const authRouter: RouterType = Router();

const SALT_ROUNDS = 12;
const JWT_SECRET = process.env.JWT_SECRET || (
  process.env.NODE_ENV === 'production' 
    ? (() => { throw new Error('JWT_SECRET must be set in production'); })()
    : 'development-secret-min-32-chars!!'
);

// Rate limiting: stricter in production, relaxed for test environment
const isTestEnv = process.env.NODE_ENV === 'test';

const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: isTestEnv ? 100 : 5, // 100 attempts in test, 5 in production
  message: { error: 'Too many attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation schemas
const RegisterSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const LoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * POST /api/auth/register
 * Create a new user account
 */
authRouter.post('/register', authLimiter, async (req: Request, res: Response) => {
  try {
    // Validate input
    const parsed = RegisterSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const { email, password } = parsed.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
      },
    });

    // Generate token
    const token = generateToken(user.id);

    // Set HttpOnly cookie
    setTokenCookie(res, token);

    res.status(201).json({
      message: 'Registration successful',
      user: { id: user.id, email: user.email },
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * POST /api/auth/login
 * Authenticate with email and password
 */
authRouter.post('/login', authLimiter, async (req: Request, res: Response) => {
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

    const { email, password } = parsed.data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate token
    const token = generateToken(user.id);

    // Set HttpOnly cookie
    setTokenCookie(res, token);

    res.json({
      message: 'Login successful',
      user: { id: user.id, email: user.email },
    });
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
 * Check if current request is authenticated
 */
authRouter.get('/check', async (req: Request, res: Response) => {
  const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    res.json({ authenticated: false });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { sub: string };
    
    // Verify user still exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: { id: true, email: true },
    });

    if (!user) {
      res.json({ authenticated: false });
      return;
    }

    res.json({ authenticated: true, user });
  } catch {
    res.json({ authenticated: false });
  }
});

/**
 * GET /api/auth/me
 * Get current user info
 */
authRouter.get('/me', async (req: Request, res: Response) => {
  const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { sub: string };
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: { id: true, email: true, createdAt: true, lastLoginAt: true },
    });

    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    res.json({ user });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
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
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  };

  if (cookieDomain) {
    cookieOptions.domain = cookieDomain;
  }

  res.cookie('token', token, cookieOptions);
}
