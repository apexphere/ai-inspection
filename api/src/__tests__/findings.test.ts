import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  FindingService,
  FindingNotFoundError,
  InspectionNotFoundError,
} from '../services/finding.js';
import type { IInspectionRepository } from '../repositories/interfaces/inspection.js';
import type { Finding, Inspection } from '@prisma/client';

// Mock repository
const createMockRepository = (): IInspectionRepository => ({
  create: vi.fn(),
  findById: vi.fn(),
  findAll: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  createFinding: vi.fn(),
  findFindingById: vi.fn(),
  findFindingsByInspection: vi.fn(),
  updateFinding: vi.fn(),
  deleteFinding: vi.fn(),
  createPhoto: vi.fn(),
  findPhotoById: vi.fn(),
  findPhotosByFinding: vi.fn(),
  deletePhoto: vi.fn(),
  createReport: vi.fn(),
  findReportById: vi.fn(),
  findReportsByInspection: vi.fn(),
});

const mockInspection: Inspection = {
  id: 'insp-1',
  address: '123 Test St',
  clientName: 'Test Client',
  inspectorName: 'Test Inspector',
  checklistId: 'nz-ppi',
  status: 'IN_PROGRESS',
  currentSection: 'exterior',
  metadata: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  completedAt: null,
};

const mockFinding: Finding = {
  id: 'find-1',
  inspectionId: 'insp-1',
  section: 'exterior',
  text: 'Crack in foundation',
  severity: 'MAJOR',
  matchedComment: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('FindingService', () => {
  let repository: IInspectionRepository;
  let service: FindingService;

  beforeEach(() => {
    repository = createMockRepository();
    service = new FindingService(repository);
  });

  describe('create', () => {
    it('should create a finding for existing inspection', async () => {
      vi.mocked(repository.findById).mockResolvedValue(mockInspection);
      vi.mocked(repository.createFinding).mockResolvedValue(mockFinding);

      const result = await service.create({
        inspectionId: 'insp-1',
        section: 'exterior',
        text: 'Crack in foundation',
        severity: 'MAJOR',
      });

      expect(repository.findById).toHaveBeenCalledWith('insp-1');
      expect(repository.createFinding).toHaveBeenCalled();
      expect(result).toEqual(mockFinding);
    });

    it('should throw InspectionNotFoundError for non-existent inspection', async () => {
      vi.mocked(repository.findById).mockResolvedValue(null);

      await expect(
        service.create({
          inspectionId: 'non-existent',
          section: 'exterior',
          text: 'Test',
        })
      ).rejects.toThrow(InspectionNotFoundError);
    });
  });

  describe('findById', () => {
    it('should return finding by id', async () => {
      vi.mocked(repository.findFindingById).mockResolvedValue(mockFinding);

      const result = await service.findById('find-1');
      expect(result).toEqual(mockFinding);
    });

    it('should throw FindingNotFoundError for non-existent finding', async () => {
      vi.mocked(repository.findFindingById).mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(
        FindingNotFoundError
      );
    });
  });

  describe('findByInspection', () => {
    it('should return all findings for inspection', async () => {
      vi.mocked(repository.findById).mockResolvedValue(mockInspection);
      vi.mocked(repository.findFindingsByInspection).mockResolvedValue([mockFinding]);

      const result = await service.findByInspection('insp-1');
      expect(result).toEqual([mockFinding]);
    });

    it('should throw InspectionNotFoundError for non-existent inspection', async () => {
      vi.mocked(repository.findById).mockResolvedValue(null);

      await expect(service.findByInspection('non-existent')).rejects.toThrow(
        InspectionNotFoundError
      );
    });
  });

  describe('update', () => {
    it('should update finding', async () => {
      const updatedFinding = { ...mockFinding, text: 'Updated text' };
      vi.mocked(repository.findFindingById).mockResolvedValue(mockFinding);
      vi.mocked(repository.updateFinding).mockResolvedValue(updatedFinding);

      const result = await service.update('find-1', { text: 'Updated text' });
      expect(result.text).toBe('Updated text');
    });

    it('should throw FindingNotFoundError for non-existent finding', async () => {
      vi.mocked(repository.findFindingById).mockResolvedValue(null);

      await expect(
        service.update('non-existent', { text: 'Updated' })
      ).rejects.toThrow(FindingNotFoundError);
    });
  });

  describe('delete', () => {
    it('should delete existing finding', async () => {
      vi.mocked(repository.findFindingById).mockResolvedValue(mockFinding);
      vi.mocked(repository.deleteFinding).mockResolvedValue();

      await expect(service.delete('find-1')).resolves.toBeUndefined();
      expect(repository.deleteFinding).toHaveBeenCalledWith('find-1');
    });

    it('should throw FindingNotFoundError for non-existent finding', async () => {
      vi.mocked(repository.findFindingById).mockResolvedValue(null);

      await expect(service.delete('non-existent')).rejects.toThrow(
        FindingNotFoundError
      );
    });
  });
});
