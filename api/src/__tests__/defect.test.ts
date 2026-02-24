/**
 * Defect Service Tests — Issue #218
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Defect } from '@prisma/client';
import { DefectService, DefectNotFoundError } from '../services/defect.js';
import type { IDefectRepository } from '../repositories/interfaces/defect.js';

function createMockRepository(): IDefectRepository {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    findByInspectionId: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    countByInspectionId: vi.fn(),
  };
}

const sampleDefect: Defect = {
  id: 'defect-123',
  inspectionId: 'inspection-456',
  defectNumber: 'D-001',
  location: 'North wall, ground floor',
  element: 'CLADDING',
  description: 'Cracked weatherboard',
  cause: 'Moisture ingress',
  remedialAction: 'Replace affected boards',
  priority: 'HIGH',
  linkedClauseId: null,
  photoIds: [],
  sortOrder: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('DefectService', () => {
  let service: DefectService;
  let mockRepo: IDefectRepository;

  beforeEach(() => {
    mockRepo = createMockRepository();
    service = new DefectService(mockRepo);
  });

  describe('create', () => {
    it('should create a defect with auto-generated number', async () => {
      vi.mocked(mockRepo.countByInspectionId).mockResolvedValue(0);
      vi.mocked(mockRepo.create).mockResolvedValue({ ...sampleDefect, defectNumber: 'D-001' });

      const result = await service.create({
        inspectionId: 'inspection-456',
        location: 'North wall, ground floor',
        element: 'CLADDING',
        description: 'Cracked weatherboard',
      });

      expect(result.defectNumber).toBe('D-001');
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ defectNumber: 'D-001' }),
      );
    });

    it('should auto-increment defect number', async () => {
      vi.mocked(mockRepo.countByInspectionId).mockResolvedValue(5);
      vi.mocked(mockRepo.create).mockResolvedValue({ ...sampleDefect, defectNumber: 'D-006' });

      const result = await service.create({
        inspectionId: 'inspection-456',
        location: 'South wall',
        element: 'WALL',
        description: 'Crack in plaster',
      });

      expect(result.defectNumber).toBe('D-006');
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ defectNumber: 'D-006' }),
      );
    });
  });

  describe('findById', () => {
    it('should return defect by id', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(sampleDefect);

      const result = await service.findById('defect-123');

      expect(result).toEqual(sampleDefect);
    });

    it('should throw DefectNotFoundError for non-existent id', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(null);

      await expect(service.findById('nonexistent'))
        .rejects.toThrow(DefectNotFoundError);
    });
  });

  describe('findByInspectionId', () => {
    it('should return all defects for inspection', async () => {
      const defects = [
        sampleDefect,
        { ...sampleDefect, id: 'defect-456', defectNumber: 'D-002', element: 'ROOF' as const },
      ];
      vi.mocked(mockRepo.findByInspectionId).mockResolvedValue(defects);

      const result = await service.findByInspectionId('inspection-456');

      expect(result).toHaveLength(2);
      expect(result[0].defectNumber).toBe('D-001');
    });

    it('should return empty array when no defects', async () => {
      vi.mocked(mockRepo.findByInspectionId).mockResolvedValue([]);

      const result = await service.findByInspectionId('inspection-789');

      expect(result).toEqual([]);
    });
  });

  describe('update', () => {
    it('should update defect fields', async () => {
      const updated = { ...sampleDefect, priority: 'CRITICAL' as const };
      vi.mocked(mockRepo.findById).mockResolvedValue(sampleDefect);
      vi.mocked(mockRepo.update).mockResolvedValue(updated);

      const result = await service.update('defect-123', { priority: 'CRITICAL' });

      expect(result.priority).toBe('CRITICAL');
    });

    it('should throw DefectNotFoundError for non-existent id', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(null);

      await expect(service.update('nonexistent', { priority: 'HIGH' }))
        .rejects.toThrow(DefectNotFoundError);
    });
  });

  describe('delete', () => {
    it('should delete existing defect', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(sampleDefect);
      vi.mocked(mockRepo.delete).mockResolvedValue(undefined);

      await service.delete('defect-123');

      expect(mockRepo.delete).toHaveBeenCalledWith('defect-123');
    });

    it('should throw DefectNotFoundError for non-existent id', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(null);

      await expect(service.delete('nonexistent'))
        .rejects.toThrow(DefectNotFoundError);
    });
  });
});
