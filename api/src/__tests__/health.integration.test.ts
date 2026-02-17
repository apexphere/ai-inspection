import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';

/**
 * Integration tests for API health and database connectivity.
 * These tests require a real Postgres database.
 */

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
      // Simple query to verify connection
      const result = await prisma.$queryRaw`SELECT 1 as value`;
      expect(result).toBeDefined();
    });

    it('should have inspection table available', async () => {
      // Count inspections (should work even if empty)
      const count = await prisma.inspection.count();
      expect(typeof count).toBe('number');
    });
  });

  describe('Inspection CRUD', () => {
    let testInspectionId: string;

    it('should create an inspection', async () => {
      const inspection = await prisma.inspection.create({
        data: {
          address: '123 Integration Test St',
          clientName: 'Test Client',
          checklistId: 'nz-ppi',
          currentSection: 'exterior',
        },
      });

      expect(inspection.id).toBeDefined();
      expect(inspection.address).toBe('123 Integration Test St');
      testInspectionId = inspection.id;
    });

    it('should read the inspection', async () => {
      const inspection = await prisma.inspection.findUnique({
        where: { id: testInspectionId },
      });

      expect(inspection).not.toBeNull();
      expect(inspection?.clientName).toBe('Test Client');
    });

    it('should update the inspection', async () => {
      const inspection = await prisma.inspection.update({
        where: { id: testInspectionId },
        data: { status: 'IN_PROGRESS' },
      });

      expect(inspection.status).toBe('IN_PROGRESS');
    });

    it('should delete the inspection', async () => {
      await prisma.inspection.delete({
        where: { id: testInspectionId },
      });

      const inspection = await prisma.inspection.findUnique({
        where: { id: testInspectionId },
      });

      expect(inspection).toBeNull();
    });
  });
});
