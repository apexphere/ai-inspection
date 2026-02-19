import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  SiteInspectionService,
  SiteInspectionNotFoundError,
} from '../services/site-inspection.js';
import type { ISiteInspectionRepository } from '../repositories/interfaces/site-inspection.js';
import type { SiteInspection } from '@prisma/client';

// Mock repository
const createMockRepository = (): ISiteInspectionRepository => ({
  create: vi.fn(),
  findById: vi.fn(),
  findByProjectId: vi.fn(),
  findAll: vi.fn(),
  update: vi.fn(),
  softDelete: vi.fn(),
  restore: vi.fn(),
  hardDelete: vi.fn(),
});

const mockSiteInspection: SiteInspection = {
  id: 'insp-1',
  projectId: 'proj-1',
  type: 'SIMPLE',
  stage: 'INS_05',
  date: new Date('2026-02-19'),
  status: 'DRAFT',
  weather: 'Fine',
  personsPresent: 'John Builder',
  equipment: ['Moisture meter'],
  methodology: null,
  areasNotAccessed: null,
  inspectorName: 'Test Inspector',
  lbpOnSite: null,
  lbpLicenseSighted: null,
  lbpLicenseNumber: null,
  lbpExpiryDate: null,
  outcome: null,
  signatureData: null,
  signatureDate: null,
  currentSection: null,
  currentClauseId: null,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('SiteInspectionService', () => {
  let repository: ISiteInspectionRepository;
  let service: SiteInspectionService;

  beforeEach(() => {
    repository = createMockRepository();
    service = new SiteInspectionService(repository);
  });

  describe('create', () => {
    it('should create a site inspection', async () => {
      vi.mocked(repository.create).mockResolvedValue(mockSiteInspection);

      const result = await service.create({
        projectId: 'proj-1',
        type: 'SIMPLE',
        stage: 'INS_05',
        date: new Date('2026-02-19'),
        inspectorName: 'Test Inspector',
      });

      expect(repository.create).toHaveBeenCalled();
      expect(result).toEqual(mockSiteInspection);
    });
  });

  describe('findById', () => {
    it('should return inspection by id', async () => {
      vi.mocked(repository.findById).mockResolvedValue(mockSiteInspection);

      const result = await service.findById('insp-1');
      expect(result).toEqual(mockSiteInspection);
    });

    it('should throw SiteInspectionNotFoundError for non-existent inspection', async () => {
      vi.mocked(repository.findById).mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(
        SiteInspectionNotFoundError
      );
    });
  });

  describe('findByProjectId', () => {
    it('should return all inspections for project', async () => {
      vi.mocked(repository.findByProjectId).mockResolvedValue([mockSiteInspection]);

      const result = await service.findByProjectId('proj-1');
      expect(result).toEqual([mockSiteInspection]);
    });
  });

  describe('findAll', () => {
    it('should return all inspections', async () => {
      vi.mocked(repository.findAll).mockResolvedValue([mockSiteInspection]);

      const result = await service.findAll();
      expect(result).toEqual([mockSiteInspection]);
    });

    it('should filter by status', async () => {
      vi.mocked(repository.findAll).mockResolvedValue([mockSiteInspection]);

      await service.findAll({ status: 'DRAFT' });
      expect(repository.findAll).toHaveBeenCalledWith({ status: 'DRAFT' });
    });

    it('should filter by type', async () => {
      vi.mocked(repository.findAll).mockResolvedValue([mockSiteInspection]);

      await service.findAll({ type: 'SIMPLE' });
      expect(repository.findAll).toHaveBeenCalledWith({ type: 'SIMPLE' });
    });
  });

  describe('update', () => {
    it('should update inspection', async () => {
      const updatedInspection = { ...mockSiteInspection, status: 'IN_PROGRESS' as const };
      vi.mocked(repository.findById).mockResolvedValue(mockSiteInspection);
      vi.mocked(repository.update).mockResolvedValue(updatedInspection);

      const result = await service.update('insp-1', { status: 'IN_PROGRESS' });
      expect(result.status).toBe('IN_PROGRESS');
    });

    it('should throw SiteInspectionNotFoundError for non-existent inspection', async () => {
      vi.mocked(repository.findById).mockResolvedValue(null);

      await expect(
        service.update('non-existent', { status: 'IN_PROGRESS' })
      ).rejects.toThrow(SiteInspectionNotFoundError);
    });
  });

  describe('softDelete', () => {
    it('should soft delete existing inspection', async () => {
      const deletedInspection = { ...mockSiteInspection, deletedAt: new Date() };
      vi.mocked(repository.findById).mockResolvedValue(mockSiteInspection);
      vi.mocked(repository.softDelete).mockResolvedValue(deletedInspection);

      const result = await service.softDelete('insp-1');
      expect(result.deletedAt).not.toBeNull();
      expect(repository.softDelete).toHaveBeenCalledWith('insp-1');
    });

    it('should throw SiteInspectionNotFoundError for non-existent inspection', async () => {
      vi.mocked(repository.findById).mockResolvedValue(null);

      await expect(service.softDelete('non-existent')).rejects.toThrow(
        SiteInspectionNotFoundError
      );
    });
  });

  describe('restore', () => {
    it('should restore soft-deleted inspection', async () => {
      const deletedInspection = { ...mockSiteInspection, deletedAt: new Date() };
      const restoredInspection = { ...mockSiteInspection, deletedAt: null };
      vi.mocked(repository.findById).mockResolvedValue(deletedInspection);
      vi.mocked(repository.restore).mockResolvedValue(restoredInspection);

      const result = await service.restore('insp-1');
      expect(result.deletedAt).toBeNull();
    });

    it('should throw error when inspection is not deleted', async () => {
      vi.mocked(repository.findById).mockResolvedValue(mockSiteInspection);

      await expect(service.restore('insp-1')).rejects.toThrow(
        'Site inspection insp-1 is not deleted'
      );
    });

    it('should throw SiteInspectionNotFoundError for non-existent inspection', async () => {
      vi.mocked(repository.findById).mockResolvedValue(null);

      await expect(service.restore('non-existent')).rejects.toThrow(
        SiteInspectionNotFoundError
      );
    });
  });

  describe('complete', () => {
    it('should mark inspection as completed', async () => {
      const completedInspection = { ...mockSiteInspection, status: 'COMPLETED' as const };
      vi.mocked(repository.findById).mockResolvedValue(mockSiteInspection);
      vi.mocked(repository.update).mockResolvedValue(completedInspection);

      const result = await service.complete('insp-1');
      expect(result.status).toBe('COMPLETED');
    });
  });

  describe('navigate', () => {
    it('should update current section and set status to in_progress', async () => {
      const navigatedInspection = {
        ...mockSiteInspection,
        currentSection: 'interior',
        status: 'IN_PROGRESS' as const,
      };
      vi.mocked(repository.findById).mockResolvedValue(mockSiteInspection);
      vi.mocked(repository.update).mockResolvedValue(navigatedInspection);

      const result = await service.navigate('insp-1', 'interior');
      expect(result.currentSection).toBe('interior');
      expect(result.status).toBe('IN_PROGRESS');
    });

    it('should update current clause for clause review', async () => {
      const navigatedInspection = {
        ...mockSiteInspection,
        type: 'CLAUSE_REVIEW' as const,
        currentSection: 'B1',
        currentClauseId: 'clause-b1',
        status: 'IN_PROGRESS' as const,
      };
      vi.mocked(repository.findById).mockResolvedValue(mockSiteInspection);
      vi.mocked(repository.update).mockResolvedValue(navigatedInspection);

      const result = await service.navigate('insp-1', 'B1', 'clause-b1');
      expect(result.currentSection).toBe('B1');
      expect(result.currentClauseId).toBe('clause-b1');
    });
  });
});
