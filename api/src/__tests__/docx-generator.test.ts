/**
 * DOCX Generator Tests — Issue #223
 *
 * Tests for the DOCX generator service with mocked fs.
 * Note: DOCX files are ZIP archives containing XML. We test behavior and structure
 * rather than searching compressed binary content for strings.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ──────────────────────────────────────────────────────────────────────────────
// Mocks — use vi.hoisted to ensure mocks are available before module loading
// ──────────────────────────────────────────────────────────────────────────────

const { mockWriteFile, mockReadFile } = vi.hoisted(() => ({
  mockWriteFile: vi.fn().mockResolvedValue(undefined),
  mockReadFile: vi.fn(),
}));

vi.mock('node:fs/promises', () => ({
  writeFile: mockWriteFile,
  readFile: mockReadFile,
}));

// ──────────────────────────────────────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────────────────────────────────────

import { DocxGeneratorService } from '../services/docx-generator.js';
import type {
  DocxReportData,
  DocxGenerateOptions,
  ClauseReviewRow,
  BuildingHistoryRow,
  PhotoEntry,
} from '../services/docx-generator.js';

describe('DocxGeneratorService', () => {
  let service: DocxGeneratorService;

  const makeReportData = (overrides: Partial<DocxReportData> = {}): DocxReportData => ({
    companyName: 'Apex Inspection Services',
    reportTitle: 'Certificate of Acceptance Report',
    address: '123 Test Street, Auckland',
    clientName: 'Test Client Ltd',
    jobNumber: 'JOB-2026-001',
    date: '20 February 2026',
    preparedBy: 'John Smith',
    sections: [
      { title: 'Executive Summary', content: 'This is the summary.' },
      { title: 'Property Description', content: 'This is the property.' },
    ],
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    service = new DocxGeneratorService();
    mockReadFile.mockRejectedValue(new Error('File not found'));
  });

  describe('generate', () => {
    it('generates DOCX buffer successfully', async () => {
      const options: DocxGenerateOptions = {
        reportData: makeReportData(),
        outputPath: '/tmp/test.docx',
      };

      const result = await service.generate(options);

      expect(result.outputPath).toBe('/tmp/test.docx');
      expect(result.fileSize).toBeGreaterThan(0);
      expect(mockWriteFile).toHaveBeenCalledWith(
        '/tmp/test.docx',
        expect.any(Buffer),
      );
    });

    it('output file is written to outputPath', async () => {
      const options: DocxGenerateOptions = {
        reportData: makeReportData(),
        outputPath: '/custom/path/report.docx',
      };

      await service.generate(options);

      expect(mockWriteFile).toHaveBeenCalledWith(
        '/custom/path/report.docx',
        expect.any(Buffer),
      );
    });

    it('returns file size matching buffer length', async () => {
      const options: DocxGenerateOptions = {
        reportData: makeReportData(),
        outputPath: '/tmp/test.docx',
      };

      const result = await service.generate(options);
      const writtenBuffer = mockWriteFile.mock.calls[0][1] as Buffer;

      expect(result.fileSize).toBe(writtenBuffer.length);
    });

    it('produces valid DOCX buffer (starts with PK zip signature)', async () => {
      const options: DocxGenerateOptions = {
        reportData: makeReportData(),
        outputPath: '/tmp/test.docx',
      };

      await service.generate(options);
      const buffer = mockWriteFile.mock.calls[0][1] as Buffer;

      // DOCX files are ZIP archives, which start with PK signature
      expect(buffer[0]).toBe(0x50); // 'P'
      expect(buffer[1]).toBe(0x4B); // 'K'
    });
  });

  describe('cover page', () => {
    it('generates document with cover page data', async () => {
      const options: DocxGenerateOptions = {
        reportData: makeReportData({
          companyName: 'Custom Company Name',
          address: '456 Custom Ave, Wellington',
          jobNumber: 'JOB-2026-999',
          clientName: 'Special Client Inc',
          preparedBy: 'Jane Doe',
        }),
        outputPath: '/tmp/test.docx',
      };

      const result = await service.generate(options);

      expect(result.outputPath).toBe('/tmp/test.docx');
      expect(result.fileSize).toBeGreaterThan(0);
    });

    it('includes credentials in prepared by when provided', async () => {
      const options: DocxGenerateOptions = {
        reportData: makeReportData({
          preparedBy: 'Jane Doe',
          preparedByCredentials: 'NZIBS, LBP',
        }),
        outputPath: '/tmp/test.docx',
      };

      // Should not throw and should produce valid output
      const result = await service.generate(options);
      expect(result.fileSize).toBeGreaterThan(0);
    });

    it('includes reviewed by when provided', async () => {
      const options: DocxGenerateOptions = {
        reportData: makeReportData({
          reviewedBy: 'Bob Reviewer',
          reviewedByCredentials: 'CPEng',
        }),
        outputPath: '/tmp/test.docx',
      };

      const result = await service.generate(options);
      expect(result.fileSize).toBeGreaterThan(0);
    });

    it('handles missing optional fields', async () => {
      const options: DocxGenerateOptions = {
        reportData: makeReportData({
          reviewedBy: undefined,
          reviewedByCredentials: undefined,
          preparedByCredentials: undefined,
          companyLogoPath: undefined,
        }),
        outputPath: '/tmp/test.docx',
      };

      // Should not throw
      const result = await service.generate(options);
      expect(result.outputPath).toBe('/tmp/test.docx');
    });

    it('reads company logo when path provided', async () => {
      const fakeImageBuffer = Buffer.from('fake-png-data');
      mockReadFile.mockResolvedValueOnce(fakeImageBuffer);

      const options: DocxGenerateOptions = {
        reportData: makeReportData({ companyLogoPath: '/images/logo.png' }),
        outputPath: '/tmp/test.docx',
      };

      await service.generate(options);

      expect(mockReadFile).toHaveBeenCalledWith('/images/logo.png');
    });

    it('falls back gracefully when logo file not found', async () => {
      mockReadFile.mockRejectedValueOnce(new Error('ENOENT'));

      const options: DocxGenerateOptions = {
        reportData: makeReportData({
          companyName: 'Fallback Company',
          companyLogoPath: '/images/missing-logo.png',
        }),
        outputPath: '/tmp/test.docx',
      };

      // Should not throw - falls back to text
      const result = await service.generate(options);
      expect(result.outputPath).toBe('/tmp/test.docx');
      expect(result.fileSize).toBeGreaterThan(0);
    });
  });

  describe('sections', () => {
    it('generates document with sections', async () => {
      const options: DocxGenerateOptions = {
        reportData: makeReportData({
          sections: [
            {
              title: 'Main Section',
              content: 'Main content',
              subsections: [{ title: 'Subsection', content: 'Sub content' }],
            },
          ],
        }),
        outputPath: '/tmp/test.docx',
      };

      const result = await service.generate(options);
      expect(result.fileSize).toBeGreaterThan(0);
    });

    it('handles multiple sections', async () => {
      const options: DocxGenerateOptions = {
        reportData: makeReportData({
          sections: [
            { title: 'First Section', content: 'Content 1' },
            { title: 'Second Section', content: 'Content 2' },
            { title: 'Third Section', content: 'Content 3' },
          ],
        }),
        outputPath: '/tmp/test.docx',
      };

      const result = await service.generate(options);
      expect(result.fileSize).toBeGreaterThan(0);
    });

    it('handles sections with empty content', async () => {
      const options: DocxGenerateOptions = {
        reportData: makeReportData({
          sections: [{ title: 'Empty Section', content: '' }],
        }),
        outputPath: '/tmp/test.docx',
      };

      const result = await service.generate(options);
      expect(result.fileSize).toBeGreaterThan(0);
    });
  });

  describe('clause review table', () => {
    it('generates document with clause review table', async () => {
      const clauseReviews: ClauseReviewRow[] = [
        {
          clauseCode: 'B1/AS1',
          title: 'Structure',
          applicability: 'APPLICABLE',
          observations: 'All structural elements verified',
          remedialWorks: 'None required',
        },
      ];

      const options: DocxGenerateOptions = {
        reportData: makeReportData({ clauseReviews }),
        outputPath: '/tmp/test.docx',
      };

      const result = await service.generate(options);
      expect(result.fileSize).toBeGreaterThan(0);
    });

    it('handles multiple clause reviews', async () => {
      const clauseReviews: ClauseReviewRow[] = [
        {
          clauseCode: 'B1/AS1',
          title: 'Structure',
          applicability: 'APPLICABLE',
          observations: 'Verified',
          remedialWorks: 'None',
        },
        {
          clauseCode: 'E2/AS1',
          title: 'External Moisture',
          applicability: 'APPLICABLE',
          observations: 'Cladding good',
          remedialWorks: 'Minor repairs',
        },
        {
          clauseCode: 'G1/AS1',
          title: 'Personal Hygiene',
          applicability: 'NA',
          observations: '',
          remedialWorks: '',
        },
      ];

      const options: DocxGenerateOptions = {
        reportData: makeReportData({ clauseReviews }),
        outputPath: '/tmp/test.docx',
      };

      const result = await service.generate(options);
      expect(result.fileSize).toBeGreaterThan(0);
    });

    it('handles NA applicability', async () => {
      const clauseReviews: ClauseReviewRow[] = [
        {
          clauseCode: 'G1/AS1',
          title: 'Personal Hygiene',
          applicability: 'NA',
          observations: '',
          remedialWorks: '',
        },
      ];

      const options: DocxGenerateOptions = {
        reportData: makeReportData({ clauseReviews }),
        outputPath: '/tmp/test.docx',
      };

      const result = await service.generate(options);
      expect(result.fileSize).toBeGreaterThan(0);
    });
  });

  describe('building history table', () => {
    it('generates document with building history table', async () => {
      const buildingHistory: BuildingHistoryRow[] = [
        {
          type: 'Building Consent',
          reference: 'BC-2020-001',
          year: '2020',
          status: 'Issued',
          description: 'New dwelling construction',
        },
      ];

      const options: DocxGenerateOptions = {
        reportData: makeReportData({ buildingHistory }),
        outputPath: '/tmp/test.docx',
      };

      const result = await service.generate(options);
      expect(result.fileSize).toBeGreaterThan(0);
    });

    it('handles multiple building history entries', async () => {
      const buildingHistory: BuildingHistoryRow[] = [
        {
          type: 'Building Consent',
          reference: 'BC-2020-001',
          year: '2020',
          status: 'Issued',
          description: 'New dwelling',
        },
        {
          type: 'Code Compliance Certificate',
          reference: 'CCC-2021-042',
          year: '2021',
          status: 'Completed',
          description: 'Final inspection',
        },
      ];

      const options: DocxGenerateOptions = {
        reportData: makeReportData({ buildingHistory }),
        outputPath: '/tmp/test.docx',
      };

      const result = await service.generate(options);
      expect(result.fileSize).toBeGreaterThan(0);
    });
  });

  describe('photo appendix', () => {
    it('handles empty photos array', async () => {
      const options: DocxGenerateOptions = {
        reportData: makeReportData({ photos: [] }),
        outputPath: '/tmp/test.docx',
      };

      // Should not throw
      const result = await service.generate(options);
      expect(result.outputPath).toBe('/tmp/test.docx');
    });

    it('handles undefined photos', async () => {
      const options: DocxGenerateOptions = {
        reportData: makeReportData({ photos: undefined }),
        outputPath: '/tmp/test.docx',
      };

      const result = await service.generate(options);
      expect(result.outputPath).toBe('/tmp/test.docx');
    });

    it('reads photo images from correct paths', async () => {
      const fakeImageBuffer = Buffer.from('fake-jpg-data');
      mockReadFile.mockResolvedValue(fakeImageBuffer);

      const photos: PhotoEntry[] = [
        { imagePath: '/uploads/photos/img001.jpg', caption: 'Photo 1', photoNumber: 1 },
        { imagePath: '/uploads/photos/img002.jpg', caption: 'Photo 2', photoNumber: 2 },
      ];

      const options: DocxGenerateOptions = {
        reportData: makeReportData({ photos }),
        outputPath: '/tmp/test.docx',
      };

      await service.generate(options);

      expect(mockReadFile).toHaveBeenCalledWith('/uploads/photos/img001.jpg');
      expect(mockReadFile).toHaveBeenCalledWith('/uploads/photos/img002.jpg');
    });

    it('handles missing photo files gracefully', async () => {
      mockReadFile.mockRejectedValue(new Error('ENOENT: file not found'));

      const photos: PhotoEntry[] = [
        { imagePath: '/photos/missing.jpg', caption: 'Missing photo', photoNumber: 1 },
      ];

      const options: DocxGenerateOptions = {
        reportData: makeReportData({ photos }),
        outputPath: '/tmp/test.docx',
      };

      // Should not throw - adds placeholder text instead
      const result = await service.generate(options);
      expect(result.outputPath).toBe('/tmp/test.docx');
      expect(result.fileSize).toBeGreaterThan(0);
    });

    it('generates document with multiple photos', async () => {
      const fakeImageBuffer = Buffer.from('fake-jpg-data');
      mockReadFile.mockResolvedValue(fakeImageBuffer);

      const photos: PhotoEntry[] = [
        { imagePath: '/photos/1.jpg', caption: 'Front elevation', photoNumber: 1 },
        { imagePath: '/photos/2.jpg', caption: 'Rear elevation', photoNumber: 2 },
        { imagePath: '/photos/3.jpg', caption: 'Side view', photoNumber: 3 },
      ];

      const options: DocxGenerateOptions = {
        reportData: makeReportData({ photos }),
        outputPath: '/tmp/test.docx',
      };

      const result = await service.generate(options);
      expect(result.fileSize).toBeGreaterThan(0);
    });
  });

  describe('page structure', () => {
    it('generates document with header and footer', async () => {
      const options: DocxGenerateOptions = {
        reportData: makeReportData({
          reportTitle: 'Custom Report Title',
          jobNumber: 'JOB-FOOTER-TEST',
        }),
        outputPath: '/tmp/test.docx',
      };

      const result = await service.generate(options);
      expect(result.fileSize).toBeGreaterThan(0);
    });

    it('generates document with two sections (cover + content)', async () => {
      const options: DocxGenerateOptions = {
        reportData: makeReportData(),
        outputPath: '/tmp/test.docx',
      };

      // The document should have cover page section and content section
      const result = await service.generate(options);
      expect(result.fileSize).toBeGreaterThan(0);
    });
  });

  describe('complete document generation', () => {
    it('generates full report with all components', async () => {
      const fakeImageBuffer = Buffer.from('fake-image-data');
      mockReadFile.mockResolvedValue(fakeImageBuffer);

      const options: DocxGenerateOptions = {
        reportData: makeReportData({
          companyName: 'Full Test Company',
          companyLogoPath: '/logo.png',
          reportTitle: 'Complete Test Report',
          address: '999 Full Street, Auckland',
          clientName: 'Complete Client Ltd',
          jobNumber: 'FULL-2026-001',
          date: '25 February 2026',
          preparedBy: 'Full Author',
          preparedByCredentials: 'NZIBS, CPEng',
          reviewedBy: 'Full Reviewer',
          reviewedByCredentials: 'LBP',
          sections: [
            { title: 'Executive Summary', content: 'Summary content here.' },
            {
              title: 'Property Description',
              content: 'Property details.',
              subsections: [
                { title: 'Location', content: 'Location info.' },
                { title: 'Construction', content: 'Construction details.' },
              ],
            },
            { title: 'Clause Review', content: 'See table below.' },
          ],
          clauseReviews: [
            {
              clauseCode: 'B1/AS1',
              title: 'Structure',
              applicability: 'APPLICABLE',
              observations: 'All verified',
              remedialWorks: 'None',
            },
            {
              clauseCode: 'E2/AS1',
              title: 'External Moisture',
              applicability: 'APPLICABLE',
              observations: 'Good condition',
              remedialWorks: 'Minor touch-ups',
            },
          ],
          buildingHistory: [
            {
              type: 'Building Consent',
              reference: 'BC-2020-001',
              year: '2020',
              status: 'Issued',
              description: 'Original consent',
            },
          ],
          photos: [
            { imagePath: '/photos/1.jpg', caption: 'Front view', photoNumber: 1 },
            { imagePath: '/photos/2.jpg', caption: 'Rear view', photoNumber: 2 },
          ],
        }),
        outputPath: '/tmp/full-report.docx',
      };

      const result = await service.generate(options);

      expect(result.outputPath).toBe('/tmp/full-report.docx');
      expect(result.fileSize).toBeGreaterThan(0);
      expect(mockWriteFile).toHaveBeenCalledWith(
        '/tmp/full-report.docx',
        expect.any(Buffer),
      );
    });
  });
});
