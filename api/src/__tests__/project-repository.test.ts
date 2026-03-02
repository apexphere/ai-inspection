/**
 * Unit tests: PrismaProjectRepository
 *
 * Verifies that repository methods pass the correct Prisma query args,
 * including the siteInspections include added in #642.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrismaProjectRepository } from '../repositories/prisma/project.js';

const mockFindUnique = vi.fn();
const mockPrisma = {
  project: {
    findUnique: mockFindUnique,
    create: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
} as never;

const mockProject = {
  id: 'proj-1',
  jobNumber: '260219-001',
  activity: 'Test',
  reportType: 'COA',
  status: 'DRAFT',
  propertyId: 'prop-1',
  clientId: 'client-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  property: { id: 'prop-1', streetAddress: '123 Test St' },
  client: { id: 'client-1', name: 'John Smith' },
  siteInspections: [
    {
      id: 'insp-1',
      type: 'SIMPLE',
      stage: 'INS_01',
      date: new Date('2026-01-15'),
      status: 'COMPLETED',
      inspectorName: 'Bob',
      outcome: null,
    },
  ],
};

describe('PrismaProjectRepository — findById (#642)', () => {
  let repo: PrismaProjectRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new PrismaProjectRepository(mockPrisma);
  });

  it('should include siteInspections in findById query', async () => {
    mockFindUnique.mockResolvedValue(mockProject);

    await repo.findById('proj-1');

    expect(mockFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'proj-1' },
        include: expect.objectContaining({
          siteInspections: expect.anything(),
        }),
      }),
    );
  });

  it('should include property and client in findById query', async () => {
    mockFindUnique.mockResolvedValue(mockProject);

    await repo.findById('proj-1');

    expect(mockFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          property: true,
          client: true,
        }),
      }),
    );
  });

  it('should return null when project not found', async () => {
    mockFindUnique.mockResolvedValue(null);

    const result = await repo.findById('non-existent');
    expect(result).toBeNull();
  });

  it('should return siteInspections in response', async () => {
    mockFindUnique.mockResolvedValue(mockProject);

    const result = await repo.findById('proj-1') as typeof mockProject;
    expect(result?.siteInspections).toHaveLength(1);
    expect(result?.siteInspections[0].id).toBe('insp-1');
  });
});
