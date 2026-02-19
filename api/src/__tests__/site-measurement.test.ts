import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SiteMeasurementService, SiteMeasurementNotFoundError } from '../services/site-measurement.js';
import type { ISiteMeasurementRepository, SiteMeasurementWithClause } from '../repositories/interfaces/site-measurement.js';

// Mock repository
function createMockRepository(): ISiteMeasurementRepository {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    findByInspectionId: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
}

// Sample measurement for tests
const sampleMeasurement: SiteMeasurementWithClause = {
  id: 'measurement-123',
  inspectionId: 'inspection-456',
  type: 'MOISTURE_CONTENT',
  location: 'Bathroom floor near shower',
  value: 15.5,
  unit: 'PERCENT',
  result: 'PASS',
  linkedClauseId: null,
  linkedClause: null,
  notes: 'Reading taken at base of shower',
  sortOrder: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('SiteMeasurementService', () => {
  let service: SiteMeasurementService;
  let mockRepo: ISiteMeasurementRepository;

  beforeEach(() => {
    mockRepo = createMockRepository();
    service = new SiteMeasurementService(mockRepo);
  });

  describe('create', () => {
    it('should create measurement and auto-evaluate PASS for moisture < 18%', async () => {
      const created = { ...sampleMeasurement, result: 'PENDING' as const };
      const evaluated = { ...sampleMeasurement, result: 'PASS' as const };
      
      vi.mocked(mockRepo.create).mockResolvedValue(created);
      vi.mocked(mockRepo.update).mockResolvedValue(evaluated);

      const result = await service.create({
        inspectionId: 'inspection-456',
        type: 'MOISTURE_CONTENT',
        location: 'Bathroom floor',
        value: 15.5,
        unit: 'PERCENT',
      });

      expect(result.result).toBe('PASS');
      expect(mockRepo.update).toHaveBeenCalledWith('measurement-123', { result: 'PASS' });
    });

    it('should create measurement and auto-evaluate FAIL for moisture > 18%', async () => {
      const created = { ...sampleMeasurement, value: 22, result: 'PENDING' as const };
      const evaluated = { ...sampleMeasurement, value: 22, result: 'FAIL' as const };
      
      vi.mocked(mockRepo.create).mockResolvedValue(created);
      vi.mocked(mockRepo.update).mockResolvedValue(evaluated);

      const result = await service.create({
        inspectionId: 'inspection-456',
        type: 'MOISTURE_CONTENT',
        location: 'Bathroom floor',
        value: 22,
        unit: 'PERCENT',
      });

      expect(result.result).toBe('FAIL');
    });

    it('should create measurement with PENDING for types without auto-eval', async () => {
      const created = { ...sampleMeasurement, type: 'DIMENSION' as const, result: 'PENDING' as const };
      
      vi.mocked(mockRepo.create).mockResolvedValue(created);

      const result = await service.create({
        inspectionId: 'inspection-456',
        type: 'DIMENSION',
        location: 'Window width',
        value: 1200,
        unit: 'MM',
      });

      expect(result.result).toBe('PENDING');
      expect(mockRepo.update).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return measurement by id', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(sampleMeasurement);

      const result = await service.findById('measurement-123');

      expect(result).toEqual(sampleMeasurement);
    });

    it('should throw SiteMeasurementNotFoundError for non-existent id', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(null);

      await expect(service.findById('nonexistent'))
        .rejects.toThrow(SiteMeasurementNotFoundError);
    });
  });

  describe('findByInspectionId', () => {
    it('should return all measurements for inspection', async () => {
      const measurements = [
        sampleMeasurement,
        { ...sampleMeasurement, id: 'measurement-456', type: 'SLOPE_FALL' as const },
      ];
      vi.mocked(mockRepo.findByInspectionId).mockResolvedValue(measurements);

      const result = await service.findByInspectionId('inspection-456');

      expect(result).toHaveLength(2);
    });
  });

  describe('update', () => {
    it('should re-evaluate when value changes', async () => {
      const updated = { ...sampleMeasurement, value: 25, result: 'FAIL' as const };
      vi.mocked(mockRepo.findById).mockResolvedValue(sampleMeasurement);
      vi.mocked(mockRepo.update).mockResolvedValue(updated);

      const result = await service.update('measurement-123', { value: 25 });

      expect(result.result).toBe('FAIL');
    });

    it('should throw SiteMeasurementNotFoundError for non-existent id', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(null);

      await expect(service.update('nonexistent', { value: 20 }))
        .rejects.toThrow(SiteMeasurementNotFoundError);
    });
  });

  describe('delete', () => {
    it('should delete existing measurement', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(sampleMeasurement);
      vi.mocked(mockRepo.delete).mockResolvedValue(undefined);

      await service.delete('measurement-123');

      expect(mockRepo.delete).toHaveBeenCalledWith('measurement-123');
    });

    it('should throw SiteMeasurementNotFoundError for non-existent id', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(null);

      await expect(service.delete('nonexistent'))
        .rejects.toThrow(SiteMeasurementNotFoundError);
    });
  });

  describe('getAcceptableRange', () => {
    it('should return range for MOISTURE_CONTENT', () => {
      const range = service.getAcceptableRange('MOISTURE_CONTENT');

      expect(range).toEqual({ max: 18, description: '< 18' });
    });

    it('should return range for SLOPE_FALL', () => {
      const range = service.getAcceptableRange('SLOPE_FALL');

      expect(range).toEqual({ min: 10, description: '≥ 10' });
    });

    it('should return null for types without ranges', () => {
      const range = service.getAcceptableRange('DIMENSION');

      expect(range).toBeNull();
    });
  });
});
