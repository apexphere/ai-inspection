/**
 * Report Generation Service
 * Generates PDF inspection reports using Puppeteer.
 */

import puppeteer from 'puppeteer';
import * as fs from 'node:fs/promises';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import * as path from 'node:path';
import Handlebars from 'handlebars';
import type { Report, Inspection, Finding, Photo } from '@prisma/client';
import type { IInspectionRepository, CreateReportInput } from '../repositories/interfaces/inspection.js';

export class ReportNotFoundError extends Error {
  constructor(id: string) {
    super(`Report not found: ${id}`);
    this.name = 'ReportNotFoundError';
  }
}

export class InspectionNotFoundError extends Error {
  constructor(id: string) {
    super(`Inspection not found: ${id}`);
    this.name = 'InspectionNotFoundError';
  }
}

export class ReportGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReportGenerationError';
  }
}

// Types for report data
interface ReportFinding {
  id: string;
  section: string;
  text: string;
  severity: 'info' | 'minor' | 'major' | 'urgent';
  matchedComment?: string | null;
}

interface ReportSection {
  id: string;
  name: string;
  findings: ReportFinding[];
  conclusion: string;
  conclusionClass: string;
}

// Register Handlebars helpers
Handlebars.registerHelper('add', (a: number, b: number) => a + b);

export class ReportService {
  private templatePath: string;
  private outputDir: string;

  constructor(
    private repository: IInspectionRepository,
    templatePath?: string,
    outputDir?: string
  ) {
    const projectRoot = path.resolve(process.cwd(), '..');
    this.templatePath = templatePath || path.join(projectRoot, 'templates', 'reports', 'inspection-report.html');
    this.outputDir = outputDir || process.env.REPORT_DIR || path.join(projectRoot, 'data', 'reports');
  }

  /**
   * Generate a PDF report for an inspection.
   */
  async generate(inspectionId: string): Promise<Report> {
    // Get inspection with findings and photos
    const inspection = await this.repository.findById(inspectionId);
    if (!inspection) {
      throw new InspectionNotFoundError(inspectionId);
    }

    // Get findings and photos
    const findings = await this.repository.findFindingsByInspection(inspectionId);
    
    // Collect photos from all findings
    const photos: Photo[] = [];
    for (const finding of findings) {
      const findingPhotos = await this.repository.findPhotosByFinding(finding.id);
      photos.push(...findingPhotos);
    }

    // Ensure output directory exists
    if (!existsSync(this.outputDir)) {
      mkdirSync(this.outputDir, { recursive: true });
    }

    // Load and compile template
    if (!existsSync(this.templatePath)) {
      throw new ReportGenerationError(`Template not found: ${this.templatePath}`);
    }
    const templateHtml = readFileSync(this.templatePath, 'utf-8');
    const template = Handlebars.compile(templateHtml);

    // Prepare template data
    const templateData = this.prepareTemplateData(inspection, findings, photos);

    // Render HTML
    const html = template(templateData);

    // Generate PDF
    const outputPath = path.join(this.outputDir, `${inspectionId}.pdf`);
    await this.renderPdf(html, outputPath, inspectionId);

    // Save report to database
    const reportInput: CreateReportInput = {
      inspectionId,
      format: 'pdf',
      path: outputPath,
    };

    return this.repository.createReport(reportInput);
  }

  /**
   * Get the latest report for an inspection.
   */
  async getLatest(inspectionId: string): Promise<Report> {
    // Verify inspection exists
    const inspection = await this.repository.findById(inspectionId);
    if (!inspection) {
      throw new InspectionNotFoundError(inspectionId);
    }

    const reports = await this.repository.findReportsByInspection(inspectionId);
    if (reports.length === 0) {
      throw new ReportNotFoundError(`No report generated for inspection: ${inspectionId}`);
    }

    // Reports are ordered by createdAt desc, so first is latest
    return reports[0] as Report;
  }

  /**
   * Get report by ID.
   */
  async findById(id: string): Promise<Report> {
    const report = await this.repository.findReportById(id);
    if (!report) {
      throw new ReportNotFoundError(id);
    }
    return report;
  }

  /**
   * Get the file path for a report.
   */
  async getFilePath(inspectionId: string): Promise<string> {
    const report = await this.getLatest(inspectionId);
    return report.path;
  }

  /**
   * Prepare data for the template.
   */
  private prepareTemplateData(
    inspection: Inspection,
    findings: Finding[],
    photos: Photo[]
  ): Record<string, unknown> {
    // Format date
    const date = inspection.completedAt
      ? new Date(inspection.completedAt).toLocaleDateString('en-NZ', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
      : new Date().toLocaleDateString('en-NZ');

    // Generate job number from inspection ID
    const jobNumber = inspection.id.substring(0, 8).toUpperCase();

    // Parse metadata
    const metadata = (inspection.metadata as Record<string, unknown>) || {};

    // Convert findings to report format
    const reportFindings: ReportFinding[] = findings.map((f) => ({
      id: f.id,
      section: f.section,
      text: f.text,
      severity: f.severity.toLowerCase() as 'info' | 'minor' | 'major' | 'urgent',
      matchedComment: f.matchedComment,
    }));

    // Get unique sections from findings
    const sectionSet = new Set<string>();
    for (const finding of reportFindings) {
      sectionSet.add(finding.section);
    }

    // Build section data
    const sections: ReportSection[] = Array.from(sectionSet).map((sectionId) => {
      const sectionFindings = reportFindings.filter((f) => f.section === sectionId);
      const { conclusion, conclusionClass } = this.generateConclusion(sectionFindings);

      return {
        id: sectionId,
        name: this.formatSectionName(sectionId),
        findings: sectionFindings,
        conclusion,
        conclusionClass,
      };
    });

    // Separate urgent and major findings for summary
    const urgentFindings = reportFindings.filter((f) => f.severity === 'urgent');
    const majorFindings = reportFindings.filter((f) => f.severity === 'major');

    // Generate executive summary
    const executiveSummary = this.generateExecutiveSummary(reportFindings, sections.length);

    // Prepare photos with captions
    const photosWithCaptions = photos.map((photo, index) => ({
      ...photo,
      caption: `Inspection photo ${index + 1}`,
      path: photo.path.startsWith('/') ? `file://${photo.path}` : photo.path,
    }));

    return {
      // Inspection details
      job_number: jobNumber,
      address: inspection.address,
      client_name: inspection.clientName,
      inspector_name: inspection.inspectorName || 'Inspector',
      date,
      weather: (metadata.weather as string) || 'Fine',

      // Building description
      property_type: (metadata.property_type as string) || 'Residential',
      year_built: (metadata.year_built as number) || 'Unknown',
      bedrooms: (metadata.bedrooms as number) || '-',
      bathrooms: (metadata.bathrooms as number) || '-',

      // Summary
      executive_summary: executiveSummary,
      urgent_findings: urgentFindings.length > 0 ? urgentFindings : null,
      major_findings: majorFindings.length > 0 ? majorFindings : null,

      // Sections
      sections,

      // Photos
      photos: photosWithCaptions,
    };
  }

  /**
   * Format section ID to display name.
   */
  private formatSectionName(sectionId: string): string {
    return sectionId
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  /**
   * Generate conclusion text for a section based on findings.
   */
  private generateConclusion(findings: ReportFinding[]): { conclusion: string; conclusionClass: string } {
    if (findings.length === 0) {
      return {
        conclusion: 'No obvious defects were noted. No requirement of immediate attention or further investigation.',
        conclusionClass: 'conclusion-good',
      };
    }

    const hasUrgent = findings.some((f) => f.severity === 'urgent');
    const hasMajor = findings.some((f) => f.severity === 'major');
    const hasMinor = findings.some((f) => f.severity === 'minor');

    if (hasUrgent) {
      return {
        conclusion: 'Significant defects noted. Immediate attention and specialist assessment recommended.',
        conclusionClass: 'conclusion-urgent',
      };
    }

    if (hasMajor) {
      return {
        conclusion: 'Items noted require attention. Recommend addressing within the next 3-6 months.',
        conclusionClass: 'conclusion-attention',
      };
    }

    if (hasMinor) {
      return {
        conclusion: 'Minor maintenance items noted as described. No requirement of immediate attention.',
        conclusionClass: '',
      };
    }

    return {
      conclusion: 'Observations recorded. Routine maintenance recommended.',
      conclusionClass: '',
    };
  }

  /**
   * Generate executive summary based on all findings.
   */
  private generateExecutiveSummary(findings: ReportFinding[], totalSections: number): string {
    const urgentCount = findings.filter((f) => f.severity === 'urgent').length;
    const majorCount = findings.filter((f) => f.severity === 'major').length;
    const minorCount = findings.filter((f) => f.severity === 'minor').length;
    const infoCount = findings.filter((f) => f.severity === 'info').length;

    if (findings.length === 0) {
      return `This property was inspected across ${totalSections} areas. No significant defects or issues were identified during the inspection. The property appears to be in good overall condition.`;
    }

    const parts: string[] = [];
    parts.push(`This property was inspected across ${totalSections} areas.`);
    parts.push(`A total of ${findings.length} item(s) were noted during the inspection.`);

    if (urgentCount > 0) {
      parts.push(`${urgentCount} urgent item(s) require immediate attention.`);
    }
    if (majorCount > 0) {
      parts.push(`${majorCount} major item(s) should be addressed in the near term.`);
    }
    if (minorCount > 0) {
      parts.push(`${minorCount} minor maintenance item(s) were observed.`);
    }
    if (infoCount > 0) {
      parts.push(`${infoCount} informational observation(s) were recorded.`);
    }

    if (urgentCount > 0) {
      parts.push('We recommend obtaining specialist assessments for urgent items before settlement.');
    } else if (majorCount > 0) {
      parts.push('We recommend addressing major items within 3-6 months.');
    } else {
      parts.push('Overall, the property is in acceptable condition with routine maintenance required.');
    }

    return parts.join(' ');
  }

  /**
   * Render HTML to PDF using Puppeteer.
   */
  private async renderPdf(html: string, outputPath: string, inspectionId: string): Promise<void> {
    // Write HTML to temp file for debugging
    const tempHtmlPath = path.join(this.outputDir, `${inspectionId}.html`);
    writeFileSync(tempHtmlPath, html);

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();

      // Set content and wait for images
      await page.setContent(html, {
        waitUntil: 'networkidle0',
        timeout: 30000,
      });

      // Generate PDF
      await page.pdf({
        path: outputPath,
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '25mm',
          left: '15mm',
        },
        displayHeaderFooter: true,
        headerTemplate: `
          <div style="font-size: 9px; width: 100%; padding: 0 15mm; display: flex; justify-content: space-between;">
            <span>Pre-Purchase Inspection Report</span>
            <span></span>
          </div>
        `,
        footerTemplate: `
          <div style="font-size: 9px; width: 100%; padding: 0 15mm; display: flex; justify-content: space-between;">
            <span>Confidential</span>
            <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
          </div>
        `,
      });
    } finally {
      await browser.close();
    }
  }
}
