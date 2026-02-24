/**
 * Form 9 Export Tests — Issue #196
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Form9ExportService, ReportNotFoundError, InspectionNotLinkedError } from '../services/form9-export.js';

// Mock data factory
function createMockReport(overrides: Record<string, unknown> = {}) {
  return {
    id: 'report-1',
    siteInspection: {
      id: 'insp-1',
      date: new Date('2026-02-20'),
      inspectorName: 'John Smith',
      weather: 'Fine, 22°C',
      methodology: 'Visual inspection with moisture testing',
      areasNotAccessed: 'Subfloor (no access hatch)',
      outcome: 'PASS',
      project: {
        jobNumber: 'INS-2026-001',
        activity: 'COA Assessment',
        reportType: 'COA',
        property: {
          streetAddress: '123 Main St, Auckland',
          lotDp: 'Lot 1 DP 12345',
          councilPropertyId: 'AKL-99999',
          territorialAuthority: 'AKL',
        },
        client: {
          name: 'Test Client Ltd',
          address: '456 Client Ave, Auckland',
          phone: '09-123-4567',
          email: 'client@test.com',
          contactPerson: 'Jane Doe',
        },
        documents: [
          {
            documentType: 'PS1',
            filename: 'ps1-plumbing.pdf',
            description: 'Producer Statement - Plumbing',
            status: 'RECEIVED',
            referenceNumber: 'PS1-001',
          },
          {
            documentType: 'COC',
            filename: 'coc-electrical.pdf',
            description: 'Certificate of Compliance - Electrical',
            status: 'RECEIVED',
            referenceNumber: 'COC-001',
          },
        ],
      },
      clauseReviews: [
        {
          applicability: 'APPLICABLE',
          observations: 'Compliant with B1 requirements',
          clause: { code: 'B1', title: 'Structure' },
        },
        {
          applicability: 'APPLICABLE',
          observations: 'Fire safety measures in place',
          clause: { code: 'C1', title: 'Outbreak of Fire' },
        },
        {
          applicability: 'NA',
          observations: null,
          clause: { code: 'G12', title: 'Water Supplies' },
        },
      ],
    },
    ...overrides,
  };
}

function createMockPrisma(report: unknown) {
  return {
    report: {
      findUnique: vi.fn().mockResolvedValue(report),
      update: vi.fn().mockResolvedValue(report),
    },
  } as unknown as Parameters<typeof Form9ExportService.prototype['extract']> extends never[]
    ? never
    : ConstructorParameters<typeof Form9ExportService>[0];
}

describe('Form9ExportService', () => {
  let service: Form9ExportService;
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    const report = createMockReport();
    mockPrisma = createMockPrisma(report);
    service = new Form9ExportService(mockPrisma);
  });

  describe('extract', () => {
    it('throws ReportNotFoundError when report does not exist', async () => {
      mockPrisma = createMockPrisma(null);
      service = new Form9ExportService(mockPrisma);

      await expect(service.extract('nonexistent')).rejects.toThrow(ReportNotFoundError);
    });

    it('throws InspectionNotLinkedError when no site inspection linked', async () => {
      mockPrisma = createMockPrisma({ id: 'report-1', siteInspection: null });
      service = new Form9ExportService(mockPrisma);

      await expect(service.extract('report-1')).rejects.toThrow(InspectionNotLinkedError);
    });

    it('extracts Part A (applicant details) from client', async () => {
      const result = await service.extract('report-1');

      expect(result.partA).toEqual({
        applicantName: 'Test Client Ltd',
        applicantAddress: '456 Client Ave, Auckland',
        applicantPhone: '09-123-4567',
        applicantEmail: 'client@test.com',
        contactPerson: 'Jane Doe',
      });
    });

    it('extracts Part B (building work) from project/property', async () => {
      const result = await service.extract('report-1');

      expect(result.partB).toEqual({
        propertyAddress: '123 Main St, Auckland',
        lotDp: 'Lot 1 DP 12345',
        councilPropertyId: 'AKL-99999',
        territorialAuthority: 'AKL',
        jobNumber: 'INS-2026-001',
        activity: 'COA Assessment',
        reportType: 'COA',
      });
    });

    it('extracts Part C (clauses) separating applicable and N/A', async () => {
      const result = await service.extract('report-1');

      expect(result.partC.compliantClauses).toHaveLength(2);
      expect(result.partC.compliantClauses[0]).toEqual({
        code: 'B1',
        title: 'Structure',
        observations: 'Compliant with B1 requirements',
      });
      expect(result.partC.nonApplicableClauses).toHaveLength(1);
      expect(result.partC.nonApplicableClauses[0].code).toBe('G12');
    });

    it('extracts Part D (limitations) from areas not accessed', async () => {
      const result = await service.extract('report-1');

      expect(result.partD.limitations).toContain(
        'Areas not accessed: Subfloor (no access hatch)',
      );
    });

    it('returns empty limitations when no areas not accessed', async () => {
      const report = createMockReport();
      (report.siteInspection as Record<string, unknown>).areasNotAccessed = null;
      mockPrisma = createMockPrisma(report);
      service = new Form9ExportService(mockPrisma);

      const result = await service.extract('report-1');
      expect(result.partD.limitations).toHaveLength(0);
    });

    it('extracts Part E (documents) from project documents', async () => {
      const result = await service.extract('report-1');

      expect(result.partE.documents).toHaveLength(2);
      expect(result.partE.documents[0]).toEqual({
        type: 'PS1',
        filename: 'ps1-plumbing.pdf',
        description: 'Producer Statement - Plumbing',
        status: 'RECEIVED',
        referenceNumber: 'PS1-001',
      });
    });

    it('extracts Part F (inspection details)', async () => {
      const result = await service.extract('report-1');

      expect(result.partF.inspectorName).toBe('John Smith');
      expect(result.partF.weather).toBe('Fine, 22°C');
      expect(result.partF.methodology).toBe('Visual inspection with moisture testing');
      expect(result.partF.outcome).toBe('PASS');
      expect(result.partF.inspectionDate).toContain('2026-02-20');
    });

    it('includes exportedAt timestamp', async () => {
      const result = await service.extract('report-1');

      expect(result.exportedAt).toBeDefined();
      expect(new Date(result.exportedAt).getTime()).not.toBeNaN();
    });

    it('caches form9Data on the report', async () => {
      await service.extract('report-1');

      expect(mockPrisma.report.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'report-1' },
          data: { form9Data: expect.objectContaining({ partA: expect.any(Object) }) },
        }),
      );
    });
  });
});
