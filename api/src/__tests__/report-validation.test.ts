/**
 * Report Validation Tests — Issue #195
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReportValidationService, ReportNotFoundError } from '../services/report-validation.js';
import type { PrismaClient } from '@prisma/client';

// Mock factories
function createMockReport(overrides: Record<string, unknown> = {}) {
  return {
    id: 'report-1',
    status: 'APPROVED',
    siteInspection: {
      id: 'inspection-1',
      inspectorName: 'John Smith',
      clauseReviews: [
        {
          id: 'cr-1',
          clauseId: 'B1',
          applicability: 'APPLICABLE',
          observations: 'All conditions met',
        },
      ],
      project: {
        id: 'project-1',
        photos: [
          {
            id: 'photo-1',
            reportNumber: 1,
            caption: 'Front elevation',
          },
        ],
        documents: [
          {
            id: 'doc-1',
            description: 'PS1 Certificate',
            status: 'RECEIVED',
          },
        ],
      },
    },
    ...overrides,
  };
}

function createMockPrisma(): PrismaClient {
  return {
    report: {
      findUnique: vi.fn(),
    },
  } as unknown as PrismaClient;
}

describe('ReportValidationService', () => {
  let service: ReportValidationService;
  let prisma: PrismaClient;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new ReportValidationService(prisma);
  });

  describe('validate', () => {
    it('should return valid when all checks pass', async () => {
      const report = createMockReport();
      vi.mocked(prisma.report.findUnique).mockResolvedValue(report as never);

      const result = await service.validate('report-1');

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should throw ReportNotFoundError when report does not exist', async () => {
      vi.mocked(prisma.report.findUnique).mockResolvedValue(null);

      await expect(service.validate('nonexistent')).rejects.toThrow(ReportNotFoundError);
    });

    it('should return not_approved error for DRAFT report', async () => {
      const report = createMockReport({ status: 'DRAFT' });
      vi.mocked(prisma.report.findUnique).mockResolvedValue(report as never);

      const result = await service.validate('report-1');

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          type: 'not_approved',
          field: 'status',
        })
      );
    });

    it('should return not_approved error for IN_REVIEW report', async () => {
      const report = createMockReport({ status: 'IN_REVIEW' });
      vi.mocked(prisma.report.findUnique).mockResolvedValue(report as never);

      const result = await service.validate('report-1');

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          type: 'not_approved',
        })
      );
    });

    it('should accept FINALIZED status', async () => {
      const report = createMockReport({ status: 'FINALIZED' });
      vi.mocked(prisma.report.findUnique).mockResolvedValue(report as never);

      const result = await service.validate('report-1');

      expect(result.valid).toBe(true);
      expect(result.errors.filter((e) => e.type === 'not_approved')).toHaveLength(0);
    });

    it('should return missing_observation for applicable clause without observations', async () => {
      const report = createMockReport({
        siteInspection: {
          id: 'inspection-1',
          inspectorName: 'John Smith',
          clauseReviews: [
            {
              id: 'cr-1',
              clauseId: 'B1',
              applicability: 'APPLICABLE',
              observations: null,
            },
          ],
          project: {
            id: 'project-1',
            photos: [],
            documents: [],
          },
        },
      });
      vi.mocked(prisma.report.findUnique).mockResolvedValue(report as never);

      const result = await service.validate('report-1');

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          type: 'missing_observation',
          entityId: 'cr-1',
        })
      );
    });

    it('should return missing_observation for applicable clause with empty observations', async () => {
      const report = createMockReport({
        siteInspection: {
          id: 'inspection-1',
          inspectorName: 'John Smith',
          clauseReviews: [
            {
              id: 'cr-1',
              clauseId: 'B1',
              applicability: 'APPLICABLE',
              observations: '   ',
            },
          ],
          project: {
            id: 'project-1',
            photos: [],
            documents: [],
          },
        },
      });
      vi.mocked(prisma.report.findUnique).mockResolvedValue(report as never);

      const result = await service.validate('report-1');

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          type: 'missing_observation',
        })
      );
    });

    it('should not check observations for NA clauses', async () => {
      const report = createMockReport({
        siteInspection: {
          id: 'inspection-1',
          inspectorName: 'John Smith',
          clauseReviews: [
            {
              id: 'cr-1',
              clauseId: 'B1',
              applicability: 'NA',
              observations: null,
            },
          ],
          project: {
            id: 'project-1',
            photos: [],
            documents: [],
          },
        },
      });
      vi.mocked(prisma.report.findUnique).mockResolvedValue(report as never);

      const result = await service.validate('report-1');

      expect(result.errors.filter((e) => e.type === 'missing_observation')).toHaveLength(0);
    });

    it('should return missing_caption for photo without caption', async () => {
      const report = createMockReport({
        siteInspection: {
          id: 'inspection-1',
          inspectorName: 'John Smith',
          clauseReviews: [
            {
              id: 'cr-1',
              clauseId: 'B1',
              applicability: 'APPLICABLE',
              observations: 'Complete',
            },
          ],
          project: {
            id: 'project-1',
            photos: [
              {
                id: 'photo-1',
                reportNumber: 1,
                caption: null,
              },
            ],
            documents: [],
          },
        },
      });
      vi.mocked(prisma.report.findUnique).mockResolvedValue(report as never);

      const result = await service.validate('report-1');

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          type: 'missing_caption',
          entityId: 'photo-1',
        })
      );
    });

    it('should return missing_caption for photo with empty caption', async () => {
      const report = createMockReport({
        siteInspection: {
          id: 'inspection-1',
          inspectorName: 'John Smith',
          clauseReviews: [
            {
              id: 'cr-1',
              clauseId: 'B1',
              applicability: 'APPLICABLE',
              observations: 'Complete',
            },
          ],
          project: {
            id: 'project-1',
            photos: [
              {
                id: 'photo-1',
                reportNumber: 1,
                caption: '',
              },
            ],
            documents: [],
          },
        },
      });
      vi.mocked(prisma.report.findUnique).mockResolvedValue(report as never);

      const result = await service.validate('report-1');

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          type: 'missing_caption',
        })
      );
    });

    it('should return missing_document for required document', async () => {
      const report = createMockReport({
        siteInspection: {
          id: 'inspection-1',
          inspectorName: 'John Smith',
          clauseReviews: [
            {
              id: 'cr-1',
              clauseId: 'B1',
              applicability: 'APPLICABLE',
              observations: 'Complete',
            },
          ],
          project: {
            id: 'project-1',
            photos: [],
            documents: [
              {
                id: 'doc-1',
                description: 'PS1 Certificate',
                status: 'REQUIRED',
              },
            ],
          },
        },
      });
      vi.mocked(prisma.report.findUnique).mockResolvedValue(report as never);

      const result = await service.validate('report-1');

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          type: 'missing_document',
          entityId: 'doc-1',
        })
      );
    });

    it('should not flag RECEIVED documents', async () => {
      const report = createMockReport({
        siteInspection: {
          id: 'inspection-1',
          inspectorName: 'John Smith',
          clauseReviews: [
            {
              id: 'cr-1',
              clauseId: 'B1',
              applicability: 'APPLICABLE',
              observations: 'Complete',
            },
          ],
          project: {
            id: 'project-1',
            photos: [],
            documents: [
              {
                id: 'doc-1',
                description: 'PS1 Certificate',
                status: 'RECEIVED',
              },
            ],
          },
        },
      });
      vi.mocked(prisma.report.findUnique).mockResolvedValue(report as never);

      const result = await service.validate('report-1');

      expect(result.errors.filter((e) => e.type === 'missing_document')).toHaveLength(0);
    });

    it('should return warning for no applicable clauses', async () => {
      const report = createMockReport({
        siteInspection: {
          id: 'inspection-1',
          inspectorName: 'John Smith',
          clauseReviews: [
            {
              id: 'cr-1',
              clauseId: 'B1',
              applicability: 'NA',
              observations: null,
            },
          ],
          project: {
            id: 'project-1',
            photos: [],
            documents: [],
          },
        },
      });
      vi.mocked(prisma.report.findUnique).mockResolvedValue(report as never);

      const result = await service.validate('report-1');

      expect(result.valid).toBe(true);
      expect(result.warnings).toContain('No applicable clauses found in clause reviews');
    });

    it('should return warning for empty clause reviews', async () => {
      const report = createMockReport({
        siteInspection: {
          id: 'inspection-1',
          inspectorName: 'John Smith',
          clauseReviews: [],
          project: {
            id: 'project-1',
            photos: [],
            documents: [],
          },
        },
      });
      vi.mocked(prisma.report.findUnique).mockResolvedValue(report as never);

      const result = await service.validate('report-1');

      expect(result.valid).toBe(true);
      expect(result.warnings).toContain('No applicable clauses found in clause reviews');
    });

    it('should return missing_inspector when inspector name is null', async () => {
      const report = createMockReport({
        siteInspection: {
          id: 'inspection-1',
          inspectorName: null,
          clauseReviews: [
            {
              id: 'cr-1',
              clauseId: 'B1',
              applicability: 'APPLICABLE',
              observations: 'Complete',
            },
          ],
          project: {
            id: 'project-1',
            photos: [],
            documents: [],
          },
        },
      });
      vi.mocked(prisma.report.findUnique).mockResolvedValue(report as never);

      const result = await service.validate('report-1');

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          type: 'missing_inspector',
        })
      );
    });

    it('should return missing_inspector when inspector name is empty', async () => {
      const report = createMockReport({
        siteInspection: {
          id: 'inspection-1',
          inspectorName: '  ',
          clauseReviews: [
            {
              id: 'cr-1',
              clauseId: 'B1',
              applicability: 'APPLICABLE',
              observations: 'Complete',
            },
          ],
          project: {
            id: 'project-1',
            photos: [],
            documents: [],
          },
        },
      });
      vi.mocked(prisma.report.findUnique).mockResolvedValue(report as never);

      const result = await service.validate('report-1');

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          type: 'missing_inspector',
          field: 'inspectorName',
        })
      );
    });

    it('should return multiple errors at once (no short-circuit)', async () => {
      const report = createMockReport({
        status: 'DRAFT',
        siteInspection: {
          id: 'inspection-1',
          inspectorName: '',
          clauseReviews: [
            {
              id: 'cr-1',
              clauseId: 'B1',
              applicability: 'APPLICABLE',
              observations: null,
            },
            {
              id: 'cr-2',
              clauseId: 'B2',
              applicability: 'APPLICABLE',
              observations: '',
            },
          ],
          project: {
            id: 'project-1',
            photos: [
              {
                id: 'photo-1',
                reportNumber: 1,
                caption: null,
              },
              {
                id: 'photo-2',
                reportNumber: 2,
                caption: '',
              },
            ],
            documents: [
              {
                id: 'doc-1',
                description: 'PS1',
                status: 'REQUIRED',
              },
              {
                id: 'doc-2',
                description: 'PS2',
                status: 'REQUIRED',
              },
            ],
          },
        },
      });
      vi.mocked(prisma.report.findUnique).mockResolvedValue(report as never);

      const result = await service.validate('report-1');

      expect(result.valid).toBe(false);
      // Should have: 1 not_approved + 1 missing_inspector + 2 missing_observation + 2 missing_caption + 2 missing_document
      expect(result.errors.length).toBeGreaterThanOrEqual(8);
      expect(result.errors.filter((e) => e.type === 'not_approved')).toHaveLength(1);
      expect(result.errors.filter((e) => e.type === 'missing_inspector')).toHaveLength(1);
      expect(result.errors.filter((e) => e.type === 'missing_observation')).toHaveLength(2);
      expect(result.errors.filter((e) => e.type === 'missing_caption')).toHaveLength(2);
      expect(result.errors.filter((e) => e.type === 'missing_document')).toHaveLength(2);
    });

    it('should handle report with no site inspection', async () => {
      const report = {
        id: 'report-1',
        status: 'APPROVED',
        siteInspection: null,
      };
      vi.mocked(prisma.report.findUnique).mockResolvedValue(report as never);

      const result = await service.validate('report-1');

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          type: 'missing_inspector',
          message: 'Report has no linked site inspection',
        })
      );
    });
  });
});
