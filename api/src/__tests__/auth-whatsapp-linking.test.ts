/**
 * WhatsApp Account Linking Tests — Issue #189
 * 
 * Tests for WhatsApp linking endpoints.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Use vi.hoisted to properly hoist mock variables
const { 
  mockUserFindUnique, 
  mockUserUpdate, 
  mockCodeCreate, 
  mockCodeFindFirst, 
  mockCodeUpdate, 
  mockCodeUpdateMany,
  mockTransaction 
} = vi.hoisted(() => ({
  mockUserFindUnique: vi.fn(),
  mockUserUpdate: vi.fn(),
  mockCodeCreate: vi.fn(),
  mockCodeFindFirst: vi.fn(),
  mockCodeUpdate: vi.fn(),
  mockCodeUpdateMany: vi.fn(),
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
        create: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
      };
      whatsAppVerificationCode = {
        create: mockCodeCreate,
        findFirst: mockCodeFindFirst,
        update: mockCodeUpdate,
        updateMany: mockCodeUpdateMany,
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

// Mock jsonwebtoken
const mockVerify = vi.fn();
vi.mock('jsonwebtoken', () => ({
  default: {
    verify: (token: string, secret: string) => mockVerify(token, secret),
    sign: vi.fn().mockReturnValue('mock_token'),
  },
}));

// Import dependencies after mocks
import express, { type Express } from 'express';
import request from 'supertest';
import { authRouter } from '../routes/auth.js';

describe('WhatsApp Account Linking Endpoints', () => {
  let app: Express;
  const validToken = 'valid_jwt_token';
  const userId = 'user-123';

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create fresh Express app for each test
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRouter);

    // Default: valid JWT
    mockVerify.mockReturnValue({ sub: userId });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('POST /api/auth/link-whatsapp', () => {
    it('should send verification code for valid phone number', async () => {
      mockUserFindUnique.mockResolvedValue(null); // No existing user with this phone
      mockCodeUpdateMany.mockResolvedValue({ count: 0 });
      mockCodeCreate.mockResolvedValue({
        id: 'code-123',
        userId,
        phoneNumber: '+64211234567',
        code: '123456',
        expiresAt: new Date(Date.now() + 600000),
      });

      const response = await request(app)
        .post('/api/auth/link-whatsapp')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ phoneNumber: '+64211234567' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Verification code sent to WhatsApp');
      expect(response.body.phoneNumber).toBe('+64211234567');
      expect(mockCodeCreate).toHaveBeenCalled();
    });

    it('should reject request without authentication', async () => {
      const response = await request(app)
        .post('/api/auth/link-whatsapp')
        .send({ phoneNumber: '+64211234567' });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Authentication required');
    });

    it('should reject invalid phone number format', async () => {
      const response = await request(app)
        .post('/api/auth/link-whatsapp')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ phoneNumber: '12345' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should reject phone number already linked to another account', async () => {
      mockUserFindUnique.mockResolvedValue({ 
        id: 'other-user', 
        phoneNumber: '+64211234567' 
      });

      const response = await request(app)
        .post('/api/auth/link-whatsapp')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ phoneNumber: '+64211234567' });

      expect(response.status).toBe(409);
      expect(response.body.error).toBe('Phone number already linked to another account');
    });

    it('should allow re-linking same phone number to same user', async () => {
      mockUserFindUnique.mockResolvedValue({ 
        id: userId, 
        phoneNumber: '+64211234567' 
      });
      mockCodeUpdateMany.mockResolvedValue({ count: 0 });
      mockCodeCreate.mockResolvedValue({
        id: 'code-123',
        userId,
        phoneNumber: '+64211234567',
        code: '123456',
        expiresAt: new Date(Date.now() + 600000),
      });

      const response = await request(app)
        .post('/api/auth/link-whatsapp')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ phoneNumber: '+64211234567' });

      expect(response.status).toBe(200);
    });
  });

  describe('POST /api/auth/verify-whatsapp', () => {
    it('should verify phone with valid code', async () => {
      mockCodeFindFirst.mockResolvedValue({
        id: 'code-123',
        userId,
        phoneNumber: '+64211234567',
        code: '123456',
        expiresAt: new Date(Date.now() + 600000),
        verifiedAt: null,
      });
      mockTransaction.mockResolvedValue([{}, {}]);

      const response = await request(app)
        .post('/api/auth/verify-whatsapp')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ phoneNumber: '+64211234567', code: '123456' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('WhatsApp number verified successfully');
    });

    it('should reject invalid verification code', async () => {
      mockCodeFindFirst.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/verify-whatsapp')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ phoneNumber: '+64211234567', code: '000000' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid or expired verification code');
    });

    it('should reject code with wrong length', async () => {
      const response = await request(app)
        .post('/api/auth/verify-whatsapp')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ phoneNumber: '+64211234567', code: '123' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('DELETE /api/auth/unlink-whatsapp', () => {
    it('should unlink WhatsApp number', async () => {
      mockUserUpdate.mockResolvedValue({
        id: userId,
        phoneNumber: null,
        phoneVerified: false,
      });

      const response = await request(app)
        .delete('/api/auth/unlink-whatsapp')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('WhatsApp number unlinked successfully');
      expect(mockUserUpdate).toHaveBeenCalledWith({
        where: { id: userId },
        data: { phoneNumber: null, phoneVerified: false },
      });
    });

    it('should reject unauthenticated request', async () => {
      const response = await request(app)
        .delete('/api/auth/unlink-whatsapp');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/auth/whatsapp-status', () => {
    it('should return linked status', async () => {
      mockUserFindUnique.mockResolvedValue({
        phoneNumber: '+64211234567',
        phoneVerified: true,
      });

      const response = await request(app)
        .get('/api/auth/whatsapp-status')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.linked).toBe(true);
      expect(response.body.phoneNumber).toBe('+64211234567');
      expect(response.body.verified).toBe(true);
    });

    it('should return unlinked status', async () => {
      mockUserFindUnique.mockResolvedValue({
        phoneNumber: null,
        phoneVerified: false,
      });

      const response = await request(app)
        .get('/api/auth/whatsapp-status')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.linked).toBe(false);
      expect(response.body.phoneNumber).toBe(null);
    });
  });
});
