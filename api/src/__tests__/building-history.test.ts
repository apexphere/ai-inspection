import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { BuildingHistory } from '@prisma/client';
import { BuildingHistoryService, BuildingHistoryNotFoundError } from '../services/building-history.js';
import type { IBuildingHistoryRepository } from '../repositories/interfaces/building-history.js';

// Mock repository
function createMockRepository(): IBuildingHistoryRepository {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    findByPropertyId: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
}

// Sample history for tests
const sampleHistory: BuildingHistory = {
  id: 'history-123',
  propertyId: 'property-456',
  type: 'BUILDING_CONSENT',
  reference: 'BC2020/1234',
  year: 2020,
  status: 'ISSUED',
  description: 'New dwelling construction',
  issuer: 'Auckland Council',
  issuedAt: new Date('2020-06-15'),
  sortOrder: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('BuildingHistoryService', () => {
  let service: BuildingHistoryService;
  let mockRepo: IBuildingHistoryRepository;

  beforeEach(() => {
    mockRepo = createMockRepository();
    service = new BuildingHistoryService(mockRepo);
  });

  describe('create', () => {
    it('should create a building history record', async () => {
      vi.mocked(mockRepo.create).mockResolvedValue(sampleHistory);

      const result = await service.create({
        propertyId: 'property-456',
        type: 'BUILDING_CONSENT',
        reference: 'BC2020/1234',
        year: 2020,
      });

      expect(result).toEqual(sampleHistory);
      expect(mockRepo.create).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return history by id', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(sampleHistory);

      const result = await service.findById('history-123');

      expect(result).toEqual(sampleHistory);
    });

    it('should throw BuildingHistoryNotFoundError for non-existent id', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(null);

      await expect(service.findById('nonexistent'))
        .rejects.toThrow(BuildingHistoryNotFoundError);
    });
  });

  describe('findByPropertyId', () => {
    it('should return all history for property', async () => {
      const histories = [
        sampleHistory,
        { ...sampleHistory, id: 'history-456', year: 2019, type: 'CCC' as const },
      ];
      vi.mocked(mockRepo.findByPropertyId).mockResolvedValue(histories);

      const result = await service.findByPropertyId('property-456');

      expect(result).toEqual(histories);
      expect(result).toHaveLength(2);
    });
  });

  describe('update', () => {
    it('should update history record', async () => {
      const updated = { ...sampleHistory, status: 'COMPLETE' as const };
      vi.mocked(mockRepo.findById).mockResolvedValue(sampleHistory);
      vi.mocked(mockRepo.update).mockResolvedValue(updated);

      const result = await service.update('history-123', { status: 'COMPLETE' });

      expect(result.status).toBe('COMPLETE');
    });

    it('should throw BuildingHistoryNotFoundError for non-existent id', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(null);

      await expect(service.update('nonexistent', { status: 'COMPLETE' }))
        .rejects.toThrow(BuildingHistoryNotFoundError);
    });
  });

  describe('delete', () => {
    it('should delete existing history record', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(sampleHistory);
      vi.mocked(mockRepo.delete).mockResolvedValue(undefined);

      await service.delete('history-123');

      expect(mockRepo.delete).toHaveBeenCalledWith('history-123');
    });

    it('should throw BuildingHistoryNotFoundError for non-existent id', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(null);

      await expect(service.delete('nonexistent'))
        .rejects.toThrow(BuildingHistoryNotFoundError);
    });
  });
});
