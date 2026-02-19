/**
 * Password Reset Tests — Issue #182
 * 
 * Tests for forgot-password and reset-password endpoints.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import crypto from 'crypto';

// Use vi.hoisted to properly hoist mock variables
const { mockUserFindUnique, mockUserUpdate, mockTokenCreate, mockTokenFindUnique, mockTokenUpdate, mockTokenUpdateMany, mockTransaction } = vi.hoisted(() => ({
  mockUserFindUnique: vi.fn(),
  mockUserUpdate: vi.fn(),
  mockTokenCreate: vi.fn(),
  mockTokenFindUnique: vi.fn(),
  mockTokenUpdate: vi.fn(),
  mockTokenUpdateMany: vi.fn(),
  mockTransaction: vi.fn(),
}));

// Mock PrismaClient as a class
vi.mock('@prisma/client', () => {
  return {
    PrismaClient: class {
      user = {
        findUnique: mockUserFindUnique,
        update: mockUserUpdate,
      };
      passwordResetToken = {
        create: mockTokenCreate,
        findUnique: mockTokenFindUnique,
        update: mockTokenUpdate,
        updateMany: mockTokenUpdateMany,
      };
      $transaction = mockTransaction;
      $connect = vi.fn();
      $disconnect = vi.fn();
    },
  };
});

// Mock bcrypt
vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed_password'),
    compare: vi.fn().mockResolvedValue(true),
  },
}));

// Mock auth middleware
vi.mock('../middleware/auth.js', () => ({
  generateToken: vi.fn().mockReturnValue('mock_jwt_token'),
}));

// Mock domain config
vi.mock('../config/domain.js', () => ({
  cookieDomain: undefined,
}));

// Import dependencies after mocks
import express, { type Express } from 'express';
import request from 'supertest';
import { authRouter } from '../routes/auth.js';

describe('Password Reset Endpoints', () => {
  let app: Express;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create fresh Express app for each test
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRouter);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('POST /api/auth/forgot-password', () => {
    it('should return success message for existing email', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        passwordHash: 'hashed',
      };

      mockUserFindUnique.mockResolvedValue(mockUser);
      mockTokenUpdateMany.mockResolvedValue({ count: 0 });
      mockTokenCreate.mockResolvedValue({
        id: 'token-123',
        userId: 'user-123',
        token: 'hashed_token',
        expiresAt: new Date(Date.now() + 3600000),
      });

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('If the email exists, a reset link has been sent');
      expect(mockTokenCreate).toHaveBeenCalled();
    });

    it('should return same success message for non-existent email (prevent enumeration)', async () => {
      mockUserFindUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('If the email exists, a reset link has been sent');
      expect(mockTokenCreate).not.toHaveBeenCalled();
    });

    it('should reject invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'not-an-email' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should invalidate existing tokens before creating new one', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        passwordHash: 'hashed',
      };

      mockUserFindUnique.mockResolvedValue(mockUser);
      mockTokenUpdateMany.mockResolvedValue({ count: 1 });
      mockTokenCreate.mockResolvedValue({
        id: 'token-new',
        userId: 'user-123',
        token: 'new_hashed_token',
        expiresAt: new Date(Date.now() + 3600000),
      });

      await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'test@example.com' });

      expect(mockTokenUpdateMany).toHaveBeenCalledWith({
        where: { userId: 'user-123', usedAt: null },
        data: { usedAt: expect.any(Date) },
      });
    });
  });

  describe('POST /api/auth/reset-password', () => {
    const validToken = 'valid_reset_token_123';
    const hashedToken = crypto.createHash('sha256').update(validToken).digest('hex');

    it('should reset password with valid token', async () => {
      const mockResetToken = {
        id: 'reset-123',
        userId: 'user-123',
        token: hashedToken,
        expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
        usedAt: null,
        user: { id: 'user-123', email: 'test@example.com' },
      };

      mockTokenFindUnique.mockResolvedValue(mockResetToken);
      mockTransaction.mockResolvedValue([{}, {}]);

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: validToken, password: 'newpassword123' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Password has been reset successfully');
    });

    it('should reject invalid token', async () => {
      mockTokenFindUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'invalid_token', password: 'newpassword123' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid or expired reset token');
    });

    it('should reject expired token', async () => {
      const expiredToken = {
        id: 'reset-123',
        userId: 'user-123',
        token: hashedToken,
        expiresAt: new Date(Date.now() - 3600000), // 1 hour ago
        usedAt: null,
        user: { id: 'user-123' },
      };

      mockTokenFindUnique.mockResolvedValue(expiredToken);

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: validToken, password: 'newpassword123' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid or expired reset token');
    });

    it('should reject already used token', async () => {
      const usedToken = {
        id: 'reset-123',
        userId: 'user-123',
        token: hashedToken,
        expiresAt: new Date(Date.now() + 3600000),
        usedAt: new Date(), // Already used
        user: { id: 'user-123' },
      };

      mockTokenFindUnique.mockResolvedValue(usedToken);

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: validToken, password: 'newpassword123' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid or expired reset token');
    });

    it('should reject short password', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: validToken, password: 'short' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details.password).toBeDefined();
    });

    it('should reject missing token', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ password: 'newpassword123' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });
  });
});
