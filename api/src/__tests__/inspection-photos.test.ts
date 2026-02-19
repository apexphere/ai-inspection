import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { InspectionPhoto } from '@prisma/client';
import { InspectionPhotoService, InspectionPhotoNotFoundError, InvalidBase64Error } from '../services/inspection-photo.js';
import type { IInspectionPhotoRepository } from '../repositories/interfaces/inspection-photo.js';

// Mock fs
vi.mock('node:fs/promises', () => ({
  mkdir: vi.fn().mockResolvedValue(undefined),
  writeFile: vi.fn().mockResolvedValue(undefined),
  unlink: vi.fn().mockResolvedValue(undefined),
  access: vi.fn().mockResolvedValue(undefined),
  readFile: vi.fn().mockResolvedValue(Buffer.from('test')),
}));

// Mock repository
function createMockRepository(): IInspectionPhotoRepository {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    findByProjectId: vi.fn(),
    findByInspectionId: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getNextReportNumber: vi.fn(),
    reorder: vi.fn(),
  };
}

// Sample photo for tests
const samplePhoto: InspectionPhoto = {
  id: 'photo-123',
  projectId: 'project-456',
  inspectionId: 'inspection-789',
  reportNumber: 1,
  filePath: '/data/photos/project-456/photo.jpg',
  thumbnailPath: null,
  filename: 'photo.jpg',
  mimeType: 'image/jpeg',
  caption: 'Test photo',
  source: 'SITE',
  takenAt: null,
  location: null,
  linkedClauses: [],
  linkedItemId: null,
  linkedItemType: null,
  sortOrder: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('InspectionPhotoService', () => {
  let service: InspectionPhotoService;
  let mockRepo: IInspectionPhotoRepository;

  beforeEach(() => {
    mockRepo = createMockRepository();
    service = new InspectionPhotoService(mockRepo);
  });

  describe('upload', () => {
    it('should upload a photo successfully', async () => {
      const base64Data = Buffer.from('test image data').toString('base64');
      vi.mocked(mockRepo.getNextReportNumber).mockResolvedValue(1);
      vi.mocked(mockRepo.create).mockResolvedValue(samplePhoto);

      const result = await service.upload({
        projectId: 'project-456',
        base64Data,
        caption: 'Test photo',
      });

      expect(result).toEqual(samplePhoto);
      expect(mockRepo.create).toHaveBeenCalled();
    });

    it('should accept data URL format', async () => {
      const base64Data = 'data:image/jpeg;base64,' + Buffer.from('test').toString('base64');
      vi.mocked(mockRepo.getNextReportNumber).mockResolvedValue(1);
      vi.mocked(mockRepo.create).mockResolvedValue(samplePhoto);

      const result = await service.upload({
        projectId: 'project-456',
        base64Data,
        caption: 'Test photo',
      });

      expect(result).toEqual(samplePhoto);
    });

    it('should reject invalid base64 data', async () => {
      await expect(service.upload({
        projectId: 'project-456',
        base64Data: '',
        caption: 'Test photo',
      })).rejects.toThrow(InvalidBase64Error);
    });

    it('should link to inspection when provided', async () => {
      const base64Data = Buffer.from('test').toString('base64');
      vi.mocked(mockRepo.getNextReportNumber).mockResolvedValue(1);
      vi.mocked(mockRepo.create).mockResolvedValue(samplePhoto);

      await service.upload({
        projectId: 'project-456',
        inspectionId: 'inspection-789',
        base64Data,
        caption: 'Test photo',
      });

      expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        inspectionId: 'inspection-789',
      }));
    });

    it('should link to checklist item when provided', async () => {
      const base64Data = Buffer.from('test').toString('base64');
      vi.mocked(mockRepo.getNextReportNumber).mockResolvedValue(1);
      vi.mocked(mockRepo.create).mockResolvedValue(samplePhoto);

      await service.upload({
        projectId: 'project-456',
        base64Data,
        caption: 'Test photo',
        linkedItemId: 'item-123',
        linkedItemType: 'ChecklistItem',
      });

      expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        linkedItemId: 'item-123',
        linkedItemType: 'ChecklistItem',
      }));
    });
  });

  describe('findById', () => {
    it('should return photo when found', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(samplePhoto);

      const result = await service.findById('photo-123');

      expect(result).toEqual(samplePhoto);
    });

    it('should throw InspectionPhotoNotFoundError when not found', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(null);

      await expect(service.findById('nonexistent'))
        .rejects.toThrow(InspectionPhotoNotFoundError);
    });
  });

  describe('findByProjectId', () => {
    it('should return photos for project', async () => {
      vi.mocked(mockRepo.findByProjectId).mockResolvedValue([samplePhoto]);

      const result = await service.findByProjectId('project-456');

      expect(result).toEqual([samplePhoto]);
    });
  });

  describe('findByInspectionId', () => {
    it('should return photos for inspection', async () => {
      vi.mocked(mockRepo.findByInspectionId).mockResolvedValue([samplePhoto]);

      const result = await service.findByInspectionId('inspection-789');

      expect(result).toEqual([samplePhoto]);
    });
  });

  describe('update', () => {
    it('should update photo caption', async () => {
      const updated = { ...samplePhoto, caption: 'Updated caption' };
      vi.mocked(mockRepo.findById).mockResolvedValue(samplePhoto);
      vi.mocked(mockRepo.update).mockResolvedValue(updated);

      const result = await service.update('photo-123', { caption: 'Updated caption' });

      expect(result.caption).toBe('Updated caption');
    });

    it('should throw when photo not found', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(null);

      await expect(service.update('nonexistent', { caption: 'Test' }))
        .rejects.toThrow(InspectionPhotoNotFoundError);
    });
  });

  describe('delete', () => {
    it('should delete photo and file', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(samplePhoto);
      vi.mocked(mockRepo.delete).mockResolvedValue(undefined);

      await service.delete('photo-123');

      expect(mockRepo.delete).toHaveBeenCalledWith('photo-123');
    });

    it('should throw when photo not found', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(null);

      await expect(service.delete('nonexistent'))
        .rejects.toThrow(InspectionPhotoNotFoundError);
    });
  });

  describe('reorder', () => {
    it('should reorder photos', async () => {
      vi.mocked(mockRepo.reorder).mockResolvedValue(undefined);

      await service.reorder('project-456', ['photo-1', 'photo-2', 'photo-3']);

      expect(mockRepo.reorder).toHaveBeenCalledWith('project-456', ['photo-1', 'photo-2', 'photo-3']);
    });
  });
});
