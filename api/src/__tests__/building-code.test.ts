import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  BuildingCodeClauseService,
  BuildingCodeClauseNotFoundError,
} from '../services/building-code.js';
import type { IBuildingCodeClauseRepository } from '../repositories/interfaces/building-code.js';
import type { BuildingCodeClause } from '@prisma/client';

// Mock repository
const createMockRepository = (): IBuildingCodeClauseRepository => ({
  create: vi.fn(),
  findById: vi.fn(),
  findByCode: vi.fn(),
  findAll: vi.fn(),
  findByCategory: vi.fn(),
  findTopLevel: vi.fn(),
  findChildren: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  bulkCreate: vi.fn(),
});

const mockClause: BuildingCodeClause = {
  id: 'clause-1',
  code: 'B1',
  title: 'Structure',
  category: 'B',
  objective: 'Buildings shall be constructed to withstand loads',
  functionalReq: null,
  performanceText: 'Buildings shall withstand combination of loads...',
  durabilityPeriod: 'FIFTY_YEARS',
  typicalEvidence: ['PS1', 'PS3'],
  sortOrder: 0,
  parentId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('BuildingCodeClauseService', () => {
  let repository: IBuildingCodeClauseRepository;
  let service: BuildingCodeClauseService;

  beforeEach(() => {
    repository = createMockRepository();
    service = new BuildingCodeClauseService(repository);
  });

  describe('create', () => {
    it('should create a building code clause', async () => {
      vi.mocked(repository.create).mockResolvedValue(mockClause);

      const result = await service.create({
        code: 'B1',
        title: 'Structure',
        category: 'B',
        performanceText: 'Buildings shall withstand...',
      });

      expect(repository.create).toHaveBeenCalled();
      expect(result).toEqual(mockClause);
    });
  });

  describe('findById', () => {
    it('should return clause by id', async () => {
      vi.mocked(repository.findById).mockResolvedValue(mockClause);

      const result = await service.findById('clause-1');
      expect(result).toEqual(mockClause);
    });

    it('should throw BuildingCodeClauseNotFoundError for non-existent clause', async () => {
      vi.mocked(repository.findById).mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(
        BuildingCodeClauseNotFoundError
      );
    });
  });

  describe('findByCode', () => {
    it('should return clause by code', async () => {
      vi.mocked(repository.findByCode).mockResolvedValue(mockClause);

      const result = await service.findByCode('B1');
      expect(result).toEqual(mockClause);
    });

    it('should throw BuildingCodeClauseNotFoundError for non-existent code', async () => {
      vi.mocked(repository.findByCode).mockResolvedValue(null);

      await expect(service.findByCode('XX')).rejects.toThrow(
        BuildingCodeClauseNotFoundError
      );
    });
  });

  describe('findByCategory', () => {
    it('should return all clauses for category', async () => {
      vi.mocked(repository.findByCategory).mockResolvedValue([mockClause]);

      const result = await service.findByCategory('B');
      expect(result).toEqual([mockClause]);
    });
  });

  describe('findTopLevel', () => {
    it('should return top-level clauses', async () => {
      vi.mocked(repository.findTopLevel).mockResolvedValue([mockClause]);

      const result = await service.findTopLevel();
      expect(result).toEqual([mockClause]);
    });
  });

  describe('findChildren', () => {
    it('should return child clauses', async () => {
      const childClause = { ...mockClause, id: 'clause-2', code: 'B1.1', parentId: 'clause-1' };
      vi.mocked(repository.findChildren).mockResolvedValue([childClause]);

      const result = await service.findChildren('clause-1');
      expect(result).toHaveLength(1);
      expect(result[0].parentId).toBe('clause-1');
    });
  });

  describe('update', () => {
    it('should update clause', async () => {
      const updatedClause = { ...mockClause, title: 'Updated Structure' };
      vi.mocked(repository.findById).mockResolvedValue(mockClause);
      vi.mocked(repository.update).mockResolvedValue(updatedClause);

      const result = await service.update('clause-1', { title: 'Updated Structure' });
      expect(result.title).toBe('Updated Structure');
    });

    it('should throw BuildingCodeClauseNotFoundError for non-existent clause', async () => {
      vi.mocked(repository.findById).mockResolvedValue(null);

      await expect(
        service.update('non-existent', { title: 'New Title' })
      ).rejects.toThrow(BuildingCodeClauseNotFoundError);
    });
  });

  describe('delete', () => {
    it('should delete existing clause', async () => {
      vi.mocked(repository.findById).mockResolvedValue(mockClause);
      vi.mocked(repository.delete).mockResolvedValue();

      await expect(service.delete('clause-1')).resolves.toBeUndefined();
      expect(repository.delete).toHaveBeenCalledWith('clause-1');
    });

    it('should throw BuildingCodeClauseNotFoundError for non-existent clause', async () => {
      vi.mocked(repository.findById).mockResolvedValue(null);

      await expect(service.delete('non-existent')).rejects.toThrow(
        BuildingCodeClauseNotFoundError
      );
    });
  });

  describe('bulkCreate', () => {
    it('should create multiple clauses', async () => {
      const clauses = [mockClause, { ...mockClause, id: 'clause-2', code: 'B2' }];
      vi.mocked(repository.bulkCreate).mockResolvedValue(clauses);

      const result = await service.bulkCreate([
        { code: 'B1', title: 'Structure', category: 'B', performanceText: 'Text 1' },
        { code: 'B2', title: 'Durability', category: 'B', performanceText: 'Text 2' },
      ]);

      expect(result).toHaveLength(2);
    });
  });

  describe('search', () => {
    it('should search clauses by keyword', async () => {
      vi.mocked(repository.findAll).mockResolvedValue([mockClause]);

      await service.search('structure');
      expect(repository.findAll).toHaveBeenCalledWith({ keyword: 'structure' });
    });
  });

  describe('getHierarchy', () => {
    it('should return clauses grouped by category', async () => {
      const clauseE = { ...mockClause, id: 'clause-e', code: 'E1', category: 'E' as const };
      vi.mocked(repository.findTopLevel).mockResolvedValue([mockClause, clauseE]);

      const hierarchy = await service.getHierarchy();

      expect(hierarchy['B']).toHaveLength(1);
      expect(hierarchy['E']).toHaveLength(1);
    });
  });
});
