/**
 * PDF Renderer Tests — Issue #222
 *
 * Tests for the PDF renderer service with mocked Puppeteer.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ──────────────────────────────────────────────────────────────────────────────
// Mocks — must be defined before vi.mock calls since they're hoisted
// ──────────────────────────────────────────────────────────────────────────────

const mockPagePdf = vi.fn().mockResolvedValue(Buffer.from('fake-pdf'));
const mockPageSetContent = vi.fn().mockResolvedValue(undefined);
const mockPageSetJavaScriptEnabled = vi.fn().mockResolvedValue(undefined);
const mockPageClose = vi.fn().mockResolvedValue(undefined);

const mockPage = {
  setJavaScriptEnabled: mockPageSetJavaScriptEnabled,
  setContent: mockPageSetContent,
  pdf: mockPagePdf,
  close: mockPageClose,
};

const mockBrowserNewPage = vi.fn().mockResolvedValue(mockPage);
const mockBrowserClose = vi.fn().mockResolvedValue(undefined);

const mockBrowser = {
  newPage: mockBrowserNewPage,
  close: mockBrowserClose,
};

vi.mock('puppeteer', () => ({
  default: {
    launch: vi.fn().mockImplementation(() => Promise.resolve(mockBrowser)),
  },
}));

vi.mock('node:fs/promises', () => ({
  stat: vi.fn().mockResolvedValue({ size: 12345 }),
}));

vi.mock('node:fs', () => ({
  readFileSync: vi.fn().mockReturnValue(
    '%PDF-1.4\n/Type /Page\n/Type /Page\n/Type /Page\n%%EOF',
  ),
}));

// ──────────────────────────────────────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────────────────────────────────────

import { PdfRendererService } from '../services/pdf-renderer.js';
import type { PdfRenderOptions, CoverPageData } from '../services/pdf-renderer.js';

describe('PdfRendererService', () => {
  let service: PdfRendererService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new PdfRendererService();
  });

  afterEach(async () => {
    await service.dispose();
  });

  describe('renderPdf', () => {
    const defaultOptions: PdfRenderOptions = {
      html: '<html><body>Test</body></html>',
      outputPath: '/tmp/test.pdf',
      jobNumber: 'JOB-2026-001',
    };

    it('generates a PDF at the specified path', async () => {
      const result = await service.renderPdf(defaultOptions);

      expect(result.outputPath).toBe('/tmp/test.pdf');
      expect(mockPagePdf).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/tmp/test.pdf',
        }),
      );
    });

    it('disables JavaScript for security', async () => {
      await service.renderPdf(defaultOptions);

      expect(mockPageSetJavaScriptEnabled).toHaveBeenCalledWith(false);
    });

    it('sets correct A4 margins', async () => {
      await service.renderPdf(defaultOptions);

      expect(mockPagePdf).toHaveBeenCalledWith(
        expect.objectContaining({
          format: 'A4',
          margin: {
            top: '25mm',
            right: '20mm',
            bottom: '25mm',
            left: '20mm',
          },
        }),
      );
    });

    it('includes header with report title', async () => {
      await service.renderPdf({
        ...defaultOptions,
        reportTitle: 'Custom Report',
      });

      const pdfCall = mockPagePdf.mock.calls[0][0];
      expect(pdfCall?.headerTemplate).toContain('Custom Report');
    });

    it('includes footer with job number', async () => {
      await service.renderPdf(defaultOptions);

      const pdfCall = mockPagePdf.mock.calls[0][0];
      expect(pdfCall?.footerTemplate).toContain('JOB-2026-001');
    });

    it('includes footer with page numbers', async () => {
      await service.renderPdf(defaultOptions);

      const pdfCall = mockPagePdf.mock.calls[0][0];
      expect(pdfCall?.footerTemplate).toContain('class="pageNumber"');
      expect(pdfCall?.footerTemplate).toContain('class="totalPages"');
    });

    it('includes footer with Confidential text', async () => {
      await service.renderPdf(defaultOptions);

      const pdfCall = mockPagePdf.mock.calls[0][0];
      expect(pdfCall?.footerTemplate).toContain('Confidential');
    });

    it('returns file size from output file', async () => {
      const result = await service.renderPdf(defaultOptions);

      expect(result.fileSize).toBe(12345);
    });

    it('returns page count from PDF content', async () => {
      const result = await service.renderPdf(defaultOptions);

      expect(result.pageCount).toBe(3);
    });

    it('enables display of header and footer', async () => {
      await service.renderPdf(defaultOptions);

      expect(mockPagePdf).toHaveBeenCalledWith(
        expect.objectContaining({
          displayHeaderFooter: true,
        }),
      );
    });

    it('enables print background', async () => {
      await service.renderPdf(defaultOptions);

      expect(mockPagePdf).toHaveBeenCalledWith(
        expect.objectContaining({
          printBackground: true,
        }),
      );
    });

    it('uses networkidle0 wait strategy', async () => {
      await service.renderPdf(defaultOptions);

      expect(mockPageSetContent).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          waitUntil: 'networkidle0',
        }),
      );
    });
  });

  describe('renderCoverPage', () => {
    const defaultData: CoverPageData = {
      companyName: 'Apex Inspection Services',
      reportTitle: 'Certificate of Acceptance Report',
      address: '123 Test Street, Auckland',
      clientName: 'Test Client Ltd',
      jobNumber: 'JOB-2026-001',
      date: '20 February 2026',
      preparedBy: 'John Smith',
    };

    it('includes company name', () => {
      const html = service.renderCoverPage(defaultData);

      expect(html).toContain('Apex Inspection Services');
    });

    it('includes property address', () => {
      const html = service.renderCoverPage(defaultData);

      expect(html).toContain('123 Test Street, Auckland');
    });

    it('includes job number', () => {
      const html = service.renderCoverPage(defaultData);

      expect(html).toContain('JOB-2026-001');
    });

    it('includes client name', () => {
      const html = service.renderCoverPage(defaultData);

      expect(html).toContain('Test Client Ltd');
    });

    it('includes date', () => {
      const html = service.renderCoverPage(defaultData);

      expect(html).toContain('20 February 2026');
    });

    it('includes prepared by', () => {
      const html = service.renderCoverPage(defaultData);

      expect(html).toContain('John Smith');
      expect(html).toContain('Prepared by');
    });

    it('includes reviewed by when provided', () => {
      const html = service.renderCoverPage({
        ...defaultData,
        reviewedBy: 'Jane Doe',
      });

      expect(html).toContain('Jane Doe');
      expect(html).toContain('Reviewed by');
    });

    it('excludes reviewed by section when not provided', () => {
      const html = service.renderCoverPage(defaultData);

      expect(html).not.toContain('Reviewed by');
    });

    it('handles missing logo gracefully with placeholder', () => {
      const html = service.renderCoverPage(defaultData);

      expect(html).toContain('cover-logo-placeholder');
      expect(html).toContain('Apex Inspection Services');
    });

    it('includes logo image when path provided', () => {
      const html = service.renderCoverPage({
        ...defaultData,
        companyLogoPath: '/images/logo.png',
      });

      expect(html).toContain('<img');
      expect(html).toContain('/images/logo.png');
      expect(html).toContain('cover-logo');
    });

    it('escapes HTML special characters', () => {
      const html = service.renderCoverPage({
        ...defaultData,
        clientName: 'Test <script>alert("xss")</script>',
      });

      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });
  });

  describe('generateTableOfContents', () => {
    it('includes all section titles', () => {
      const sections = ['Executive Summary', 'Property Description', 'Clause Review'];
      const html = service.generateTableOfContents(sections);

      expect(html).toContain('Executive Summary');
      expect(html).toContain('Property Description');
      expect(html).toContain('Clause Review');
    });

    it('numbers entries correctly', () => {
      const sections = ['First', 'Second', 'Third'];
      const html = service.generateTableOfContents(sections);

      expect(html).toContain('1.');
      expect(html).toContain('2.');
      expect(html).toContain('3.');
    });

    it('returns empty string for empty array', () => {
      const html = service.generateTableOfContents([]);

      expect(html).toBe('');
    });

    it('uses correct CSS classes', () => {
      const html = service.generateTableOfContents(['Test']);

      expect(html).toContain('toc-list');
      expect(html).toContain('toc-entry');
      expect(html).toContain('toc-number');
      expect(html).toContain('toc-title');
    });

    it('generates clickable anchor links to sections', () => {
      const sections = ['Executive Summary', 'Introduction'];
      const html = service.generateTableOfContents(sections);

      expect(html).toContain('href="#section-1"');
      expect(html).toContain('href="#section-2"');
      expect(html).toContain('toc-link');
    });

    it('escapes HTML in section titles', () => {
      const html = service.generateTableOfContents(['<script>bad</script>']);

      expect(html).not.toContain('<script>bad</script>');
      expect(html).toContain('&lt;script&gt;');
    });
  });

  describe('dispose', () => {
    it('closes browser on dispose', async () => {
      // Trigger browser creation
      await service.renderPdf({
        html: '<html></html>',
        outputPath: '/tmp/test.pdf',
        jobNumber: 'TEST',
      });

      await service.dispose();

      expect(mockBrowserClose).toHaveBeenCalled();
    });

    it('handles dispose when browser not created', async () => {
      // Should not throw
      await expect(service.dispose()).resolves.toBeUndefined();
    });
  });
});
