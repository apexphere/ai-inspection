import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  NAReasonTemplateService,
  NAReasonTemplateNotFoundError,
} from '../services/na-reason-template.js';
import type { INAReasonTemplateRepository } from '../repositories/interfaces/na-reason-template.js';
import type { NAReasonTemplate } from '@prisma/client';

// Mock repository
const createMockRepository = (): INAReasonTemplateRepository => ({
  findAll: vi.fn(),
  findById: vi.fn(),
});

const mockTemplate: NAReasonTemplate = {
  id: 'template-1',
  template: 'The CoA works do not affect {element}. As such, this Clause is not applicable.',
  usage: 'General - when works don\'t impact a specific building element',
  sortOrder: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('NAReasonTemplateService', () => {
  let repository: INAReasonTemplateRepository;
  let service: NAReasonTemplateService;

  beforeEach(() => {
    repository = createMockRepository();
    service = new NAReasonTemplateService(repository);
  });

  describe('findAll', () => {
    it('should return all templates', async () => {
      const templates = [
        mockTemplate,
        { ...mockTemplate, id: 'template-2', template: 'This Clause does not apply to {space_type}.', sortOrder: 2 },
      ];
      vi.mocked(repository.findAll).mockResolvedValue(templates);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      expect(result[0].template).toContain('CoA works');
    });

    it('should return empty array when no templates', async () => {
      vi.mocked(repository.findAll).mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toHaveLength(0);
    });
  });

  describe('findById', () => {
    it('should return template by id', async () => {
      vi.mocked(repository.findById).mockResolvedValue(mockTemplate);

      const result = await service.findById('template-1');

      expect(result).toEqual(mockTemplate);
    });

    it('should throw NAReasonTemplateNotFoundError for non-existent template', async () => {
      vi.mocked(repository.findById).mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(
        NAReasonTemplateNotFoundError
      );
    });
  });
});
