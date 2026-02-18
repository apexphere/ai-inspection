import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fs from 'node:fs/promises';
import {
  PhotoService,
  PhotoNotFoundError,
  FindingNotFoundError,
  InvalidBase64Error,
} from '../services/photo.js';
import type { IInspectionRepository } from '../repositories/interfaces/inspection.js';
import type { Finding, Photo } from '@prisma/client';

// Mock fs module
vi.mock('node:fs/promises', () => ({
  mkdir: vi.fn().mockResolvedValue(undefined),
  writeFile: vi.fn().mockResolvedValue(undefined),
  unlink: vi.fn().mockResolvedValue(undefined),
  access: vi.fn().mockResolvedValue(undefined),
  readFile: vi.fn().mockResolvedValue(Buffer.from('test')),
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

const mockPhoto: Photo = {
  id: 'photo-1',
  findingId: 'find-1',
  filename: 'test.jpg',
  path: '/tmp/photos/test.jpg',
  mimeType: 'image/jpeg',
  createdAt: new Date(),
};

// Valid base64 for a tiny PNG
const validBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

describe('PhotoService', () => {
  let repository: IInspectionRepository;
  let service: PhotoService;

  beforeEach(() => {
    repository = createMockRepository();
    service = new PhotoService(repository, '/tmp/test-photos');
    vi.clearAllMocks();
  });

  describe('upload', () => {
    it('should upload photo for existing finding', async () => {
      vi.mocked(repository.findFindingById).mockResolvedValue(mockFinding);
      vi.mocked(repository.createPhoto).mockResolvedValue(mockPhoto);

      const result = await service.upload({
        findingId: 'find-1',
        base64Data: validBase64,
        mimeType: 'image/png',
      });

      expect(repository.findFindingById).toHaveBeenCalledWith('find-1');
      expect(fs.mkdir).toHaveBeenCalled();
      expect(fs.writeFile).toHaveBeenCalled();
      expect(repository.createPhoto).toHaveBeenCalled();
      expect(result).toEqual(mockPhoto);
    });

    it('should handle data URL format', async () => {
      vi.mocked(repository.findFindingById).mockResolvedValue(mockFinding);
      vi.mocked(repository.createPhoto).mockResolvedValue(mockPhoto);

      await service.upload({
        findingId: 'find-1',
        base64Data: `data:image/png;base64,${validBase64}`,
      });

      expect(repository.createPhoto).toHaveBeenCalledWith(
        expect.objectContaining({
          mimeType: 'image/png',
        })
      );
    });

    it('should throw FindingNotFoundError for non-existent finding', async () => {
      vi.mocked(repository.findFindingById).mockResolvedValue(null);

      await expect(
        service.upload({
          findingId: 'non-existent',
          base64Data: validBase64,
        })
      ).rejects.toThrow(FindingNotFoundError);
    });

    it('should throw InvalidBase64Error for invalid base64', async () => {
      vi.mocked(repository.findFindingById).mockResolvedValue(mockFinding);

      await expect(
        service.upload({
          findingId: 'find-1',
          base64Data: '!!!invalid!!!',
        })
      ).rejects.toThrow(InvalidBase64Error);
    });
  });

  describe('findById', () => {
    it('should return photo by id', async () => {
      vi.mocked(repository.findPhotoById).mockResolvedValue(mockPhoto);

      const result = await service.findById('photo-1');
      expect(result).toEqual(mockPhoto);
    });

    it('should throw PhotoNotFoundError for non-existent photo', async () => {
      vi.mocked(repository.findPhotoById).mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(
        PhotoNotFoundError
      );
    });
  });

  describe('findByFinding', () => {
    it('should return all photos for finding', async () => {
      vi.mocked(repository.findFindingById).mockResolvedValue(mockFinding);
      vi.mocked(repository.findPhotosByFinding).mockResolvedValue([mockPhoto]);

      const result = await service.findByFinding('find-1');
      expect(result).toEqual([mockPhoto]);
    });

    it('should throw FindingNotFoundError for non-existent finding', async () => {
      vi.mocked(repository.findFindingById).mockResolvedValue(null);

      await expect(service.findByFinding('non-existent')).rejects.toThrow(
        FindingNotFoundError
      );
    });
  });

  describe('delete', () => {
    it('should delete photo and file', async () => {
      vi.mocked(repository.findPhotoById).mockResolvedValue(mockPhoto);
      vi.mocked(repository.deletePhoto).mockResolvedValue();

      await expect(service.delete('photo-1')).resolves.toBeUndefined();
      expect(fs.unlink).toHaveBeenCalledWith(mockPhoto.path);
      expect(repository.deletePhoto).toHaveBeenCalledWith('photo-1');
    });

    it('should throw PhotoNotFoundError for non-existent photo', async () => {
      vi.mocked(repository.findPhotoById).mockResolvedValue(null);

      await expect(service.delete('non-existent')).rejects.toThrow(
        PhotoNotFoundError
      );
    });

    it('should continue if file deletion fails', async () => {
      vi.mocked(repository.findPhotoById).mockResolvedValue(mockPhoto);
      vi.mocked(fs.unlink).mockRejectedValue(new Error('File not found'));
      vi.mocked(repository.deletePhoto).mockResolvedValue();

      // Should not throw - just logs warning
      await expect(service.delete('photo-1')).resolves.toBeUndefined();
      expect(repository.deletePhoto).toHaveBeenCalledWith('photo-1');
    });
  });

  describe('getFilePath', () => {
    it('should return file path for photo', async () => {
      vi.mocked(repository.findPhotoById).mockResolvedValue(mockPhoto);

      const result = await service.getFilePath('photo-1');
      expect(result).toBe(mockPhoto.path);
    });

    it('should throw PhotoNotFoundError for non-existent photo', async () => {
      vi.mocked(repository.findPhotoById).mockResolvedValue(null);

      await expect(service.getFilePath('non-existent')).rejects.toThrow(
        PhotoNotFoundError
      );
    });
  });
});
