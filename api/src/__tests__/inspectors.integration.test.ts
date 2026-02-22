/**
 * Inspectors API Integration Tests — Issue #351
 *
 * Integration tests for phone number lookup endpoint.
 * Requires a real Postgres database.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';

describe('Inspector Phone Lookup Integration', () => {
  let prisma: PrismaClient;
  let testUserId: string;

  const testUser = {
    email: 'test-inspector@example.com',
    name: 'Test Inspector',
    phoneNumber: '+64211234567',
    phoneVerified: true,
    passwordHash: '$2a$12$placeholder',
  };

  beforeAll(async () => {
    prisma = new PrismaClient();
    await prisma.$connect();

    // Create test user
    const user = await prisma.user.create({
      data: testUser,
    });
    testUserId = user.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.user.deleteMany({
      where: { email: testUser.email },
    });
    await prisma.$disconnect();
  });

  describe('Database Lookup', () => {
    it('should find user by phone number', async () => {
      const user = await prisma.user.findFirst({
        where: {
          phoneNumber: '+64211234567',
          phoneVerified: true,
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });

      expect(user).not.toBeNull();
      expect(user?.id).toBe(testUserId);
      expect(user?.name).toBe('Test Inspector');
      expect(user?.email).toBe('test-inspector@example.com');
    });

    it('should not find unverified phone numbers', async () => {
      // Create unverified user
      const unverified = await prisma.user.create({
        data: {
          email: 'unverified@example.com',
          name: 'Unverified User',
          phoneNumber: '+64212222222',
          phoneVerified: false,
          passwordHash: '$2a$12$placeholder',
        },
      });

      const user = await prisma.user.findFirst({
        where: {
          phoneNumber: '+64212222222',
          phoneVerified: true,
        },
      });

      expect(user).toBeNull();

      // Cleanup
      await prisma.user.delete({ where: { id: unverified.id } });
    });

    it('should return null for unknown phone number', async () => {
      const user = await prisma.user.findFirst({
        where: {
          phoneNumber: '+64299999999',
          phoneVerified: true,
        },
      });

      expect(user).toBeNull();
    });
  });
});
