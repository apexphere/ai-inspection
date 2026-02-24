/**
 * Report Management Tests — Issue #192
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReportManagementService, ReportNotFoundError, InvalidStatusTransitionError } from '../services/report-management.js';
import type { IReportManagementRepository } from '../repositories/interfaces/report.js';
import type { Report } from '@prisma/client';

// Mock report factory
function createMockReport(overrides: Partial<Report> = {}): Report {
  return {
    id: 'report-1',
    inspectionId: null,
    siteInspectionId: 'inspection-1',
    type: 'COA',
    status: 'DRAFT',
    version: 1,
    format: 'pdf',
    path: null,
    pdfPath: null,
    pdfSize: null,
    generatedAt: null,
    preparedById: 'user-1',
    reviewedById: null,
    reviewedAt: null,
    form9Data: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// Mock repository
function createMockRepository(): IReportManagementRepository {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    findAll: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findBySiteInspectionId: vi.fn(),
  };
}

describe('ReportManagementService', () => {
  let service: ReportManagementService;
  let repo: IReportManagementRepository;

  beforeEach(() => {
    repo = createMockRepository();
    service = new ReportManagementService(repo);
  });

  describe('create', () => {
    it('should create a report', async () => {
      const input = {
        siteInspectionId: 'inspection-1',
        type: 'COA' as const,
        preparedById: 'user-1',
      };
      const expected = createMockReport();
      vi.mocked(repo.create).mockResolvedValue(expected);

      const result = await service.create(input);

      expect(repo.create).toHaveBeenCalledWith(input);
      expect(result).toEqual(expected);
    });
  });

  describe('findById', () => {
    it('should return a report when found', async () => {
      const expected = createMockReport();
      vi.mocked(repo.findById).mockResolvedValue(expected);

      const result = await service.findById('report-1');
      expect(result).toEqual(expected);
    });

    it('should throw ReportNotFoundError when not found', async () => {
      vi.mocked(repo.findById).mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(ReportNotFoundError);
    });
  });

  describe('findAll', () => {
    it('should return reports with filters', async () => {
      const reports = [createMockReport()];
      vi.mocked(repo.findAll).mockResolvedValue(reports);

      const result = await service.findAll({ status: 'DRAFT' });

      expect(repo.findAll).toHaveBeenCalledWith({ status: 'DRAFT' });
      expect(result).toEqual(reports);
    });
  });

  describe('status transitions', () => {
    it('should allow DRAFT → REVIEW', async () => {
      const report = createMockReport({ status: 'DRAFT' });
      vi.mocked(repo.findById).mockResolvedValue(report);
      vi.mocked(repo.update).mockResolvedValue(createMockReport({ status: 'REVIEW' }));

      const result = await service.submitForReview('report-1');
      expect(result.status).toBe('REVIEW');
    });

    it('should allow REVIEW → DRAFT (request changes)', async () => {
      const report = createMockReport({ status: 'REVIEW' });
      vi.mocked(repo.findById).mockResolvedValue(report);
      vi.mocked(repo.update).mockResolvedValue(createMockReport({ status: 'DRAFT' }));

      const result = await service.requestChanges('report-1');
      expect(result.status).toBe('DRAFT');
    });

    it('should allow REVIEW → APPROVED', async () => {
      const report = createMockReport({ status: 'REVIEW' });
      vi.mocked(repo.findById).mockResolvedValue(report);
      vi.mocked(repo.update).mockResolvedValue(createMockReport({ status: 'APPROVED' }));

      const result = await service.approve('report-1', 'reviewer-1');
      expect(repo.update).toHaveBeenCalledWith('report-1', expect.objectContaining({
        status: 'APPROVED',
        reviewedById: 'reviewer-1',
      }));
      expect(result.status).toBe('APPROVED');
    });

    it('should allow APPROVED → GENERATED', async () => {
      const report = createMockReport({ status: 'APPROVED' });
      vi.mocked(repo.findById).mockResolvedValue(report);
      vi.mocked(repo.update).mockResolvedValue(createMockReport({ status: 'GENERATED' }));

      const result = await service.markGenerated('report-1', '/reports/test.pdf', 1024);
      expect(repo.update).toHaveBeenCalledWith('report-1', expect.objectContaining({
        status: 'GENERATED',
        pdfPath: '/reports/test.pdf',
        pdfSize: 1024,
      }));
      expect(result.status).toBe('GENERATED');
    });

    it('should allow GENERATED → SUBMITTED', async () => {
      const report = createMockReport({ status: 'GENERATED' });
      vi.mocked(repo.findById).mockResolvedValue(report);
      vi.mocked(repo.update).mockResolvedValue(createMockReport({ status: 'SUBMITTED' }));

      const result = await service.markSubmitted('report-1');
      expect(result.status).toBe('SUBMITTED');
    });

    it('should reject DRAFT → APPROVED (skip REVIEW)', async () => {
      const report = createMockReport({ status: 'DRAFT' });
      vi.mocked(repo.findById).mockResolvedValue(report);

      await expect(
        service.update('report-1', { status: 'APPROVED' })
      ).rejects.toThrow(InvalidStatusTransitionError);
    });

    it('should reject DRAFT → GENERATED', async () => {
      const report = createMockReport({ status: 'DRAFT' });
      vi.mocked(repo.findById).mockResolvedValue(report);

      await expect(
        service.update('report-1', { status: 'GENERATED' })
      ).rejects.toThrow(InvalidStatusTransitionError);
    });

    it('should reject SUBMITTED → DRAFT', async () => {
      const report = createMockReport({ status: 'SUBMITTED' });
      vi.mocked(repo.findById).mockResolvedValue(report);

      await expect(
        service.update('report-1', { status: 'DRAFT' })
      ).rejects.toThrow(InvalidStatusTransitionError);
    });

    it('should allow update without status change', async () => {
      const report = createMockReport({ status: 'DRAFT' });
      vi.mocked(repo.findById).mockResolvedValue(report);
      vi.mocked(repo.update).mockResolvedValue(report);

      const result = await service.update('report-1', { preparedById: 'user-2' });
      expect(result).toEqual(report);
    });
  });

  describe('delete', () => {
    it('should delete a report', async () => {
      const report = createMockReport();
      vi.mocked(repo.findById).mockResolvedValue(report);
      vi.mocked(repo.delete).mockResolvedValue();

      await service.delete('report-1');
      expect(repo.delete).toHaveBeenCalledWith('report-1');
    });

    it('should throw when deleting nonexistent report', async () => {
      vi.mocked(repo.findById).mockResolvedValue(null);

      await expect(service.delete('nonexistent')).rejects.toThrow(ReportNotFoundError);
    });
  });

  describe('findBySiteInspectionId', () => {
    it('should return reports for an inspection', async () => {
      const reports = [createMockReport(), createMockReport({ id: 'report-2', version: 2 })];
      vi.mocked(repo.findBySiteInspectionId).mockResolvedValue(reports);

      const result = await service.findBySiteInspectionId('inspection-1');
      expect(result).toHaveLength(2);
    });
  });
});
