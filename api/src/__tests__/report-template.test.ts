import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { ReportTemplate } from '@prisma/client';
import {
  ReportTemplateService,
  ReportTemplateNotFoundError,
} from '../services/report-template.js';
import type { IReportTemplateRepository } from '../repositories/interfaces/report-template.js';

function createMockRepository(): IReportTemplateRepository {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    findAll: vi.fn(),
    findByType: vi.fn(),
    findVersions: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
}

const sampleTemplate: ReportTemplate = {
  id: 'tmpl-1',
  name: 'Exterior Observations',
  type: 'SECTION',
  reportType: 'COA',
  content: '## Exterior\n\n{{observations}}',
  variables: ['observations'],
  version: 1,
  isDefault: true,
  isActive: true,
  createdAt: new Date('2026-02-24T00:00:00Z'),
  updatedAt: new Date('2026-02-24T00:00:00Z'),
};

describe('ReportTemplateService', () => {
  let service: ReportTemplateService;
  let mockRepo: IReportTemplateRepository;

  beforeEach(() => {
    mockRepo = createMockRepository();
    service = new ReportTemplateService(mockRepo);
  });

  // ─── create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    it('should create a template', async () => {
      vi.mocked(mockRepo.create).mockResolvedValue(sampleTemplate);

      const result = await service.create({
        name: 'Exterior Observations',
        type: 'SECTION',
        reportType: 'COA',
        content: '## Exterior\n\n{{observations}}',
        variables: ['observations'],
      });

      expect(result).toEqual(sampleTemplate);
      expect(mockRepo.create).toHaveBeenCalled();
    });

    it('should create a template without reportType (applies to all types)', async () => {
      const generic = { ...sampleTemplate, reportType: null };
      vi.mocked(mockRepo.create).mockResolvedValue(generic);

      const result = await service.create({
        name: 'Generic Section',
        type: 'BOILERPLATE',
        content: 'Generic content',
      });

      expect(result.reportType).toBeNull();
    });
  });

  // ─── findById ─────────────────────────────────────────────────────────────

  describe('findById', () => {
    it('should return a template by id', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(sampleTemplate);
      const result = await service.findById('tmpl-1');
      expect(result).toEqual(sampleTemplate);
    });

    it('should throw ReportTemplateNotFoundError for unknown id', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(null);
      await expect(service.findById('nonexistent')).rejects.toThrow(ReportTemplateNotFoundError);
    });
  });

  // ─── findAll ──────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('should return all active templates without filters', async () => {
      vi.mocked(mockRepo.findAll).mockResolvedValue([sampleTemplate]);
      const result = await service.findAll();
      expect(result).toHaveLength(1);
    });

    it('should pass filter params to repository', async () => {
      vi.mocked(mockRepo.findAll).mockResolvedValue([]);
      await service.findAll({ type: 'SECTION', reportType: 'COA' });
      expect(mockRepo.findAll).toHaveBeenCalledWith({ type: 'SECTION', reportType: 'COA' });
    });
  });

  // ─── findByType ───────────────────────────────────────────────────────────

  describe('findByType', () => {
    it('should find templates by type', async () => {
      vi.mocked(mockRepo.findByType).mockResolvedValue([sampleTemplate]);
      const result = await service.findByType('SECTION', 'COA');
      expect(result).toHaveLength(1);
      expect(mockRepo.findByType).toHaveBeenCalledWith('SECTION', 'COA');
    });
  });

  // ─── update ───────────────────────────────────────────────────────────────

  describe('update', () => {
    it('should update a template', async () => {
      const updated = { ...sampleTemplate, content: '## Updated' };
      vi.mocked(mockRepo.findById).mockResolvedValue(sampleTemplate);
      vi.mocked(mockRepo.update).mockResolvedValue(updated);

      const result = await service.update('tmpl-1', { content: '## Updated' });
      expect(result.content).toBe('## Updated');
    });

    it('should throw ReportTemplateNotFoundError when updating non-existent template', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(null);
      await expect(service.update('nonexistent', { content: 'x' })).rejects.toThrow(ReportTemplateNotFoundError);
    });
  });

  // ─── delete ───────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('should delete an existing template', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(sampleTemplate);
      vi.mocked(mockRepo.delete).mockResolvedValue(undefined);
      await service.delete('tmpl-1');
      expect(mockRepo.delete).toHaveBeenCalledWith('tmpl-1');
    });

    it('should throw ReportTemplateNotFoundError for unknown id', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(null);
      await expect(service.delete('nonexistent')).rejects.toThrow(ReportTemplateNotFoundError);
    });
  });

  // ─── createVersion ────────────────────────────────────────────────────────

  describe('createVersion', () => {
    it('should create version N+1 based on existing versions', async () => {
      const v2 = { ...sampleTemplate, id: 'tmpl-2', version: 2 };
      vi.mocked(mockRepo.findById).mockResolvedValue(sampleTemplate);
      vi.mocked(mockRepo.findVersions).mockResolvedValue([sampleTemplate]);
      vi.mocked(mockRepo.create).mockResolvedValue(v2);

      const result = await service.createVersion('tmpl-1', { content: '## Updated content' });

      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ version: 2, name: 'Exterior Observations' })
      );
      expect(result.version).toBe(2);
    });

    it('should inherit variables from source if not provided', async () => {
      const v2 = { ...sampleTemplate, id: 'tmpl-2', version: 2 };
      vi.mocked(mockRepo.findById).mockResolvedValue(sampleTemplate);
      vi.mocked(mockRepo.findVersions).mockResolvedValue([sampleTemplate]);
      vi.mocked(mockRepo.create).mockResolvedValue(v2);

      await service.createVersion('tmpl-1', { content: '## New' });

      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ variables: sampleTemplate.variables })
      );
    });

    it('should throw ReportTemplateNotFoundError for unknown source', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(null);
      await expect(service.createVersion('nonexistent', { content: 'x' })).rejects.toThrow(ReportTemplateNotFoundError);
    });
  });

  // ─── getVersionHistory ────────────────────────────────────────────────────

  describe('getVersionHistory', () => {
    it('should return all versions for the same name+type', async () => {
      const v2 = { ...sampleTemplate, id: 'tmpl-2', version: 2 };
      vi.mocked(mockRepo.findById).mockResolvedValue(sampleTemplate);
      vi.mocked(mockRepo.findVersions).mockResolvedValue([v2, sampleTemplate]);

      const result = await service.getVersionHistory('tmpl-1');

      expect(result).toHaveLength(2);
      expect(mockRepo.findVersions).toHaveBeenCalledWith(sampleTemplate.name, sampleTemplate.type);
    });
  });

  // ─── setDefault ───────────────────────────────────────────────────────────

  describe('setDefault', () => {
    it('should mark template as default and unmark siblings', async () => {
      const sibling = { ...sampleTemplate, id: 'tmpl-2', version: 2, isDefault: true };
      const updated = { ...sampleTemplate, isDefault: true };
      vi.mocked(mockRepo.findById).mockResolvedValue(sampleTemplate);
      vi.mocked(mockRepo.findVersions).mockResolvedValue([sibling, sampleTemplate]);
      vi.mocked(mockRepo.update).mockResolvedValue(updated);

      await service.setDefault('tmpl-1');

      // Should unmark sibling then mark self
      expect(mockRepo.update).toHaveBeenCalledWith('tmpl-2', { isDefault: false });
      expect(mockRepo.update).toHaveBeenCalledWith('tmpl-1', { isDefault: true });
    });

    it('should throw ReportTemplateNotFoundError for unknown id', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(null);
      await expect(service.setDefault('nonexistent')).rejects.toThrow(ReportTemplateNotFoundError);
    });
  });
});
