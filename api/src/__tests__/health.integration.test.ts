import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';

describe('API Integration Tests', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = new PrismaClient();
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Database Connection', () => {
    it('should connect to the database', async () => {
      const result = await prisma.$queryRaw`SELECT 1 as value`;
      expect(result).toBeDefined();
    });

    it('should have projects table available', async () => {
      const count = await prisma.project.count();
      expect(typeof count).toBe('number');
    });
  });
});
