/**
 * PDF Renderer Service — Issue #222
 *
 * Generates A4 PDFs from HTML using Puppeteer.
 * Includes cover page and table of contents generation.
 */

import puppeteer, { Browser } from 'puppeteer';
import { stat } from 'node:fs/promises';
import { readFileSync } from 'node:fs';

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

export interface PdfRenderOptions {
  html: string;
  outputPath: string;
  jobNumber: string;
  reportTitle?: string;
}

export interface PdfRenderResult {
  outputPath: string;
  fileSize: number;
  pageCount: number | undefined;
}

export interface CoverPageData {
  companyName: string;
  companyLogoPath?: string;
  reportTitle: string;
  address: string;
  clientName: string;
  jobNumber: string;
  date: string;
  preparedBy: string;
  reviewedBy?: string;
}

// ──────────────────────────────────────────────────────────────────────────────
// Service
// ──────────────────────────────────────────────────────────────────────────────

export class PdfRendererService {
  private browser: Browser | null = null;

  /**
   * Render HTML to PDF.
   */
  async renderPdf(options: PdfRenderOptions): Promise<PdfRenderResult> {
    const {
      html,
      outputPath,
      jobNumber,
      reportTitle = 'Certificate of Acceptance Report',
    } = options;

    const browser = await this.getBrowser();
    const page = await browser.newPage();

    try {
      // Disable JavaScript for security (Casey's review requirement)
      await page.setJavaScriptEnabled(false);

      // Set content and wait for resources
      await page.setContent(html, {
        waitUntil: 'networkidle0',
        timeout: 30000,
      });

      // Generate PDF with A4 format and margins
      await page.pdf({
        path: outputPath,
        format: 'A4',
        printBackground: true,
        margin: {
          top: '25mm',
          right: '20mm',
          bottom: '25mm',
          left: '20mm',
        },
        displayHeaderFooter: true,
        headerTemplate: `
          <div style="font-size: 8px; width: 100%; padding: 0 20mm; display: flex; justify-content: space-between; color: #666;">
            <span>${this.escapeHtml(reportTitle)}</span>
            <span>${this.escapeHtml(jobNumber)}</span>
          </div>
        `,
        footerTemplate: `
          <div style="font-size: 8px; width: 100%; padding: 0 20mm; display: flex; justify-content: space-between; color: #666;">
            <span>Confidential</span>
            <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
          </div>
        `,
      });

      // Get file size
      const stats = await stat(outputPath);
      const fileSize = stats.size;

      // Get page count by counting /Page occurrences in PDF
      const pageCount = this.countPdfPages(outputPath);

      return {
        outputPath,
        fileSize,
        pageCount,
      };
    } finally {
      await page.close();
    }
  }

  /**
   * Generate cover page HTML.
   */
  renderCoverPage(data: CoverPageData): string {
    const {
      companyName,
      companyLogoPath,
      reportTitle,
      address,
      clientName,
      jobNumber,
      date,
      preparedBy,
      reviewedBy,
    } = data;

    const logoHtml = companyLogoPath
      ? `<img src="${this.escapeHtml(companyLogoPath)}" alt="${this.escapeHtml(companyName)}" class="cover-logo" />`
      : `<div class="cover-logo-placeholder">${this.escapeHtml(companyName)}</div>`;

    const reviewedByHtml = reviewedBy
      ? `<div class="cover-reviewed-by"><span class="label">Reviewed by:</span> ${this.escapeHtml(reviewedBy)}</div>`
      : '';

    return `
<div class="cover-page">
  <div class="cover-content">
    <div class="cover-header">
      ${logoHtml}
    </div>

    <div class="cover-title">
      <h1>${this.escapeHtml(reportTitle)}</h1>
    </div>

    <div class="cover-details">
      <div class="cover-address">${this.escapeHtml(address)}</div>
      <div class="cover-client"><span class="label">Client:</span> ${this.escapeHtml(clientName)}</div>
      <div class="cover-job-number"><span class="label">Job Number:</span> ${this.escapeHtml(jobNumber)}</div>
      <div class="cover-date"><span class="label">Date:</span> ${this.escapeHtml(date)}</div>
    </div>

    <div class="cover-footer">
      <div class="cover-prepared-by"><span class="label">Prepared by:</span> ${this.escapeHtml(preparedBy)}</div>
      ${reviewedByHtml}
    </div>
  </div>
</div>
`;
  }

  /**
   * Generate table of contents HTML.
   */
  generateTableOfContents(sectionTitles: string[]): string {
    if (sectionTitles.length === 0) {
      return '';
    }

    const entries = sectionTitles
      .map(
        (title, index) =>
          `<li class="toc-entry"><span class="toc-number">${index + 1}.</span> <span class="toc-title">${this.escapeHtml(title)}</span></li>`,
      )
      .join('\n');

    return `
<ol class="toc-list">
  ${entries}
</ol>
`;
  }

  /**
   * Clean up resources.
   */
  async dispose(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Get or create browser instance.
   */
  private async getBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      });
    }
    return this.browser;
  }

  /**
   * Count pages in a PDF file by searching for /Page occurrences.
   */
  private countPdfPages(pdfPath: string): number | undefined {
    try {
      const content = readFileSync(pdfPath, 'latin1');
      // Match /Type /Page (not /Pages)
      const matches = content.match(/\/Type\s*\/Page[^s]/g);
      return matches ? matches.length : undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Escape HTML special characters.
   */
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
