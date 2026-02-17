import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  NavigationService,
  InspectionNotFoundError,
  InvalidSectionError,
} from '../services/navigation.js';
import type { IInspectionRepository } from '../repositories/interfaces/inspection.js';
import type { Inspection, Finding } from '@prisma/client';

// Mock checklist service
vi.mock('../services/checklist.js', () => ({
  checklistService: {
    getChecklist: vi.fn().mockReturnValue({
      id: 'nz-ppi',
      name: 'NZ Pre-Purchase Inspection',
      version: '1.0',
      sections: [
        { id: 'exterior', name: 'Exterior', prompt: 'Check exterior.', items: ['walls', 'roof'] },
        { id: 'interior', name: 'Interior', prompt: 'Check interior.', items: ['floors', 'ceilings'] },
        { id: 'roof', name: 'Roof', prompt: 'Check roof.', items: ['tiles', 'gutters'] },
      ],
    }),
    getAllSections: vi.fn().mockReturnValue([
      { id: 'exterior', name: 'Exterior' },
      { id: 'interior', name: 'Interior' },
      { id: 'roof', name: 'Roof' },
    ]),
  },
}));

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
  text: 'Crack in wall',
  severity: 'MAJOR',
  matchedComment: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('NavigationService', () => {
  let repository: IInspectionRepository;
  let service: NavigationService;

  beforeEach(() => {
    repository = createMockRepository();
    service = new NavigationService(repository);
    vi.clearAllMocks();
  });

  describe('navigate', () => {
    it('should navigate to a valid section', async () => {
      vi.mocked(repository.findById).mockResolvedValue(mockInspection);
      vi.mocked(repository.update).mockResolvedValue({ ...mockInspection, currentSection: 'interior' });

      const result = await service.navigate('insp-1', 'interior');

      expect(repository.update).toHaveBeenCalledWith('insp-1', {
        currentSection: 'interior',
        status: 'IN_PROGRESS',
      });
      expect(result.previousSection).toBe('exterior');
      expect(result.currentSection).toBe('interior');
      expect(result.sectionName).toBe('Interior');
    });

    it('should throw InspectionNotFoundError for non-existent inspection', async () => {
      vi.mocked(repository.findById).mockResolvedValue(null);

      await expect(service.navigate('non-existent', 'interior')).rejects.toThrow(
        InspectionNotFoundError
      );
    });

    it('should throw InvalidSectionError for invalid section', async () => {
      vi.mocked(repository.findById).mockResolvedValue(mockInspection);

      await expect(service.navigate('insp-1', 'invalid-section')).rejects.toThrow(
        InvalidSectionError
      );
    });
  });

  describe('getStatus', () => {
    it('should return inspection status', async () => {
      vi.mocked(repository.findById).mockResolvedValue(mockInspection);
      vi.mocked(repository.findFindingsByInspection).mockResolvedValue([mockFinding]);

      const result = await service.getStatus('insp-1');

      expect(result.inspectionId).toBe('insp-1');
      expect(result.address).toBe('123 Test St');
      expect(result.currentSection.id).toBe('exterior');
      expect(result.totalFindings).toBe(1);
      expect(result.progress.total).toBe(3);
    });

    it('should throw InspectionNotFoundError for non-existent inspection', async () => {
      vi.mocked(repository.findById).mockResolvedValue(null);

      await expect(service.getStatus('non-existent')).rejects.toThrow(
        InspectionNotFoundError
      );
    });

    it('should calculate progress correctly', async () => {
      vi.mocked(repository.findById).mockResolvedValue(mockInspection);
      vi.mocked(repository.findFindingsByInspection).mockResolvedValue([
        mockFinding,
        { ...mockFinding, id: 'find-2', section: 'interior' },
      ]);

      const result = await service.getStatus('insp-1');

      // 2 sections with findings out of 3 total
      expect(result.progress.completed).toBe(2);
      expect(result.progress.total).toBe(3);
      expect(result.progress.percentage).toBe(67);
    });
  });

  describe('suggest', () => {
    it('should suggest next unvisited section', async () => {
      vi.mocked(repository.findById).mockResolvedValue(mockInspection);
      vi.mocked(repository.findFindingsByInspection).mockResolvedValue([mockFinding]);

      const result = await service.suggest('insp-1');

      expect(result.inspectionId).toBe('insp-1');
      expect(result.currentSection).toBe('exterior');
      expect(result.nextSection?.id).toBe('interior');
      expect(result.remainingSections).toBe(2);
    });

    it('should throw InspectionNotFoundError for non-existent inspection', async () => {
      vi.mocked(repository.findById).mockResolvedValue(null);

      await expect(service.suggest('non-existent')).rejects.toThrow(
        InspectionNotFoundError
      );
    });

    it('should indicate canComplete when 50% visited', async () => {
      vi.mocked(repository.findById).mockResolvedValue(mockInspection);
      vi.mocked(repository.findFindingsByInspection).mockResolvedValue([
        mockFinding,
        { ...mockFinding, id: 'find-2', section: 'interior' },
      ]);

      const result = await service.suggest('insp-1');

      // 2 of 3 sections = 67% > 50%
      expect(result.canComplete).toBe(true);
    });
  });
});
