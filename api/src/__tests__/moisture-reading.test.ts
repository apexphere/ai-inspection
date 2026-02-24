import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { MoistureReading } from '@prisma/client';
import {
  MoistureReadingService,
  MoistureReadingNotFoundError,
  evaluateMoistureResult,
} from '../services/moisture-reading.js';
import type { IMoistureReadingRepository } from '../repositories/interfaces/moisture-reading.js';

function createMockRepository(): IMoistureReadingRepository {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    findByInspectionId: vi.fn(),
    findAll: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
}

const sampleReading: MoistureReading = {
  id: 'mr-1',
  inspectionId: 'insp-1',
  location: 'shower base',
  substrate: 'timber framing',
  reading: 12,
  depth: 10,
  result: 'ACCEPTABLE',
  defectId: null,
  linkedClauseId: null,
  notes: null,
  takenAt: null,
  sortOrder: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ─── evaluateMoistureResult (pure function) ────────────────────────────────

describe('evaluateMoistureResult', () => {
  it('should return ACCEPTABLE for readings below 18%', () => {
    expect(evaluateMoistureResult(0)).toBe('ACCEPTABLE');
    expect(evaluateMoistureResult(10)).toBe('ACCEPTABLE');
    expect(evaluateMoistureResult(17.9)).toBe('ACCEPTABLE');
  });

  it('should return MARGINAL for readings between 18% and 25%', () => {
    expect(evaluateMoistureResult(18)).toBe('MARGINAL');
    expect(evaluateMoistureResult(20)).toBe('MARGINAL');
    expect(evaluateMoistureResult(25)).toBe('MARGINAL');
  });

  it('should return UNACCEPTABLE for readings above 25%', () => {
    expect(evaluateMoistureResult(25.1)).toBe('UNACCEPTABLE');
    expect(evaluateMoistureResult(30)).toBe('UNACCEPTABLE');
    expect(evaluateMoistureResult(100)).toBe('UNACCEPTABLE');
  });
});

// ─── MoistureReadingService ─────────────────────────────────────────────────

describe('MoistureReadingService', () => {
  let service: MoistureReadingService;
  let mockRepo: IMoistureReadingRepository;

  beforeEach(() => {
    mockRepo = createMockRepository();
    service = new MoistureReadingService(mockRepo);
  });

  // ─── create ─────────────────────────────────────────────────────────────

  describe('create', () => {
    it('should auto-evaluate result when not provided', async () => {
      vi.mocked(mockRepo.create).mockResolvedValue(sampleReading);

      await service.create({
        inspectionId: 'insp-1',
        location: 'shower base',
        reading: 12,
      });

      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ result: 'ACCEPTABLE' })
      );
    });

    it('should auto-evaluate MARGINAL for 20%', async () => {
      const marginal = { ...sampleReading, reading: 20, result: 'MARGINAL' as const };
      vi.mocked(mockRepo.create).mockResolvedValue(marginal);

      await service.create({
        inspectionId: 'insp-1',
        location: 'north wall',
        reading: 20,
      });

      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ result: 'MARGINAL' })
      );
    });

    it('should auto-evaluate UNACCEPTABLE for 30%', async () => {
      const bad = { ...sampleReading, reading: 30, result: 'UNACCEPTABLE' as const };
      vi.mocked(mockRepo.create).mockResolvedValue(bad);

      await service.create({
        inspectionId: 'insp-1',
        location: 'bathroom floor',
        reading: 30,
      });

      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ result: 'UNACCEPTABLE' })
      );
    });

    it('should respect explicit result override', async () => {
      vi.mocked(mockRepo.create).mockResolvedValue(sampleReading);

      await service.create({
        inspectionId: 'insp-1',
        location: 'test',
        reading: 30,
        result: 'ACCEPTABLE', // Manual override
      });

      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ result: 'ACCEPTABLE' })
      );
    });
  });

  // ─── findById ───────────────────────────────────────────────────────────

  describe('findById', () => {
    it('should return reading by id', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(sampleReading);
      const result = await service.findById('mr-1');
      expect(result).toEqual(sampleReading);
    });

    it('should throw MoistureReadingNotFoundError for unknown id', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(null);
      await expect(service.findById('nope')).rejects.toThrow(MoistureReadingNotFoundError);
    });
  });

  // ─── findByInspectionId ─────────────────────────────────────────────────

  describe('findByInspectionId', () => {
    it('should return all readings for an inspection', async () => {
      const readings = [sampleReading, { ...sampleReading, id: 'mr-2', location: 'kitchen' }];
      vi.mocked(mockRepo.findByInspectionId).mockResolvedValue(readings);

      const result = await service.findByInspectionId('insp-1');
      expect(result).toHaveLength(2);
    });
  });

  // ─── update ─────────────────────────────────────────────────────────────

  describe('update', () => {
    it('should re-evaluate result when reading changes', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(sampleReading);
      const updated = { ...sampleReading, reading: 22, result: 'MARGINAL' as const };
      vi.mocked(mockRepo.update).mockResolvedValue(updated);

      const result = await service.update('mr-1', { reading: 22 });

      expect(mockRepo.update).toHaveBeenCalledWith('mr-1', expect.objectContaining({
        reading: 22,
        result: 'MARGINAL',
      }));
      expect(result.result).toBe('MARGINAL');
    });

    it('should not re-evaluate if result is explicitly set', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(sampleReading);
      vi.mocked(mockRepo.update).mockResolvedValue({
        ...sampleReading,
        reading: 30,
        result: 'ACCEPTABLE',
      });

      await service.update('mr-1', { reading: 30, result: 'ACCEPTABLE' });

      expect(mockRepo.update).toHaveBeenCalledWith('mr-1', expect.objectContaining({
        result: 'ACCEPTABLE',
      }));
    });

    it('should throw MoistureReadingNotFoundError for unknown id', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(null);
      await expect(service.update('nope', { reading: 10 })).rejects.toThrow(MoistureReadingNotFoundError);
    });
  });

  // ─── delete ─────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('should delete existing reading', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(sampleReading);
      vi.mocked(mockRepo.delete).mockResolvedValue(undefined);

      await service.delete('mr-1');
      expect(mockRepo.delete).toHaveBeenCalledWith('mr-1');
    });

    it('should throw MoistureReadingNotFoundError for unknown id', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(null);
      await expect(service.delete('nope')).rejects.toThrow(MoistureReadingNotFoundError);
    });
  });
});
