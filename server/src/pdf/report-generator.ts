/**
 * PDF Report Generator - Issue #7
 * 
 * Generates professional PDF inspection reports using Puppeteer.
 */

import puppeteer from 'puppeteer';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import Handlebars from 'handlebars';
import { commentLibrary } from '../services/comments.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ============================================================================
// Types
// ============================================================================

export interface ReportInspection {
  id: string;
  address: string;
  client_name: string;
  inspector_name?: string;
  started_at: string;
  completed_at?: string;
  metadata?: {
    property_type?: string;
    year_built?: number;
    bedrooms?: number;
    bathrooms?: number;
    weather?: string;
  };
}

export interface ReportFinding {
  id: string;
  section: string;
  text: string;
  severity: 'info' | 'minor' | 'major' | 'urgent';
  matched_comment?: string;
}

export interface ReportPhoto {
  id: string;
  section: string;
  filename: string;
  path: string;
  caption?: string;
}

export interface ReportSection {
  id: string;
  name: string;
  findings: ReportFinding[];
  conclusion: string;
  conclusion_class: string;
}

export interface ReportData {
  inspection: ReportInspection;
  findings: ReportFinding[];
  photos: ReportPhoto[];
  sections: Array<{ id: string; name: string }>;
}

export interface GeneratedReport {
  path: string;
  size: number;
  pages: number;
}

// ============================================================================
// Handlebars Helpers
// ============================================================================

// Register helpers
Handlebars.registerHelper('add', (a: number, b: number) => a + b);
Handlebars.registerHelper('if', function(this: unknown, conditional: unknown, options: Handlebars.HelperOptions) {
  if (conditional) {
    return options.fn(this);
  }
  return options.inverse(this);
});

// ============================================================================
// Report Generator Service
// ============================================================================

export class ReportGenerator {
  private templatePath: string;
  private outputDir: string;

  constructor(templatePath?: string, outputDir?: string) {
    const projectRoot = join(__dirname, '..', '..', '..');
    this.templatePath = templatePath || join(projectRoot, 'templates', 'reports', 'inspection-report.html');
    this.outputDir = outputDir || join(projectRoot, 'data', 'reports');
  }

  /**
   * Generate a PDF report for an inspection.
   */
  async generate(data: ReportData): Promise<GeneratedReport> {
    // Ensure output directory exists
    if (!existsSync(this.outputDir)) {
      mkdirSync(this.outputDir, { recursive: true });
    }

    // Load and compile template
    const templateHtml = readFileSync(this.templatePath, 'utf-8');
    const template = Handlebars.compile(templateHtml);

    // Prepare template data
    const templateData = this.prepareTemplateData(data);

    // Render HTML
    const html = template(templateData);

    // Generate PDF
    const outputPath = join(this.outputDir, `${data.inspection.id}.pdf`);
    const pdfInfo = await this.renderPdf(html, outputPath, data.inspection.id);

    return {
      path: outputPath,
      size: pdfInfo.size,
      pages: pdfInfo.pages,
    };
  }

  /**
   * Prepare data for the template.
   */
  private prepareTemplateData(data: ReportData): Record<string, unknown> {
    const { inspection, findings, photos, sections } = data;

    // Format date
    const date = inspection.completed_at 
      ? new Date(inspection.completed_at).toLocaleDateString('en-NZ', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
      : new Date().toLocaleDateString('en-NZ');

    // Generate job number from inspection ID
    const jobNumber = inspection.id.substring(0, 8).toUpperCase();

    // Group findings by section
    const findingsBySection = new Map<string, ReportFinding[]>();
    for (const finding of findings) {
      const sectionFindings = findingsBySection.get(finding.section) || [];
      sectionFindings.push(finding);
      findingsBySection.set(finding.section, sectionFindings);
    }

    // Build section data with conclusions
    const sectionData: ReportSection[] = sections.map(section => {
      const sectionFindings = findingsBySection.get(section.id) || [];
      const { conclusion, conclusionClass } = this.generateConclusion(sectionFindings);
      
      return {
        id: section.id,
        name: section.name,
        findings: sectionFindings,
        conclusion,
        conclusion_class: conclusionClass,
      };
    });

    // Separate urgent and major findings for summary
    const urgentFindings = findings.filter(f => f.severity === 'urgent');
    const majorFindings = findings.filter(f => f.severity === 'major');

    // Generate executive summary
    const executiveSummary = this.generateExecutiveSummary(findings, sections.length);

    // Prepare photos with captions
    const photosWithCaptions = photos.map((photo, index) => ({
      ...photo,
      caption: photo.caption || `Inspection photo ${index + 1}`,
      // Convert to file:// URL for Puppeteer
      path: photo.path.startsWith('/') ? `file://${photo.path}` : photo.path,
    }));

    return {
      // Inspection details
      job_number: jobNumber,
      address: inspection.address,
      client_name: inspection.client_name,
      inspector_name: inspection.inspector_name || 'Inspector',
      date,
      weather: inspection.metadata?.weather || 'Fine',

      // Building description
      property_type: inspection.metadata?.property_type || 'Residential',
      year_built: inspection.metadata?.year_built || 'Unknown',
      bedrooms: inspection.metadata?.bedrooms || '-',
      bathrooms: inspection.metadata?.bathrooms || '-',

      // Summary
      executive_summary: executiveSummary,
      urgent_findings: urgentFindings.length > 0 ? urgentFindings : null,
      major_findings: majorFindings.length > 0 ? majorFindings : null,

      // Sections
      sections: sectionData,

      // Photos
      photos: photosWithCaptions,
    };
  }

  /**
   * Generate conclusion text for a section based on findings.
   */
  private generateConclusion(findings: ReportFinding[]): { conclusion: string; conclusionClass: string } {
    if (findings.length === 0) {
      return {
        conclusion: commentLibrary.getConclusion('good') || 
          'No obvious defects were noted. No requirement of immediate attention or further investigation.',
        conclusionClass: 'conclusion-good',
      };
    }

    const hasUrgent = findings.some(f => f.severity === 'urgent');
    const hasMajor = findings.some(f => f.severity === 'major');
    const hasMinor = findings.some(f => f.severity === 'minor');

    if (hasUrgent) {
      return {
        conclusion: commentLibrary.getConclusion('urgent') ||
          'Significant defects noted. Immediate attention and specialist assessment recommended.',
        conclusionClass: 'conclusion-urgent',
      };
    }

    if (hasMajor) {
      return {
        conclusion: commentLibrary.getConclusion('attention') ||
          'Items noted require attention. Recommend addressing within the next 3-6 months.',
        conclusionClass: 'conclusion-attention',
      };
    }

    if (hasMinor) {
      return {
        conclusion: commentLibrary.getConclusion('minor') ||
          'Minor maintenance items noted as described. No requirement of immediate attention.',
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
    const urgentCount = findings.filter(f => f.severity === 'urgent').length;
    const majorCount = findings.filter(f => f.severity === 'major').length;
    const minorCount = findings.filter(f => f.severity === 'minor').length;
    const infoCount = findings.filter(f => f.severity === 'info').length;

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
  private async renderPdf(html: string, outputPath: string, inspectionId: string): Promise<{ size: number; pages: number }> {
    // Write HTML to temp file for debugging (optional)
    const tempHtmlPath = join(this.outputDir, `${inspectionId}.html`);
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
      const pdfBuffer = await page.pdf({
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

      // Get page count (approximate from buffer size)
      // A typical A4 PDF page is ~50-100KB without images
      const sizeKB = pdfBuffer.length / 1024;
      const estimatedPages = Math.max(1, Math.ceil(sizeKB / 75));

      return {
        size: pdfBuffer.length,
        pages: estimatedPages,
      };
    } finally {
      await browser.close();
    }
  }
}

// Singleton instance
let generatorInstance: ReportGenerator | null = null;

export function getReportGenerator(): ReportGenerator {
  if (!generatorInstance) {
    generatorInstance = new ReportGenerator();
  }
  return generatorInstance;
}
