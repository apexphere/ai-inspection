/**
 * Report Compiler Service
 *
 * Compiles PPI report data into HTML using Handlebars templates.
 */

import Handlebars from 'handlebars';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import type { PpiReportData } from './ppi-report-builder.js';

const TEMPLATES_DIR = path.resolve(process.cwd(), 'templates/ppi');

// ──────────────────────────────────────────────────────────────────────────────
// Service
// ──────────────────────────────────────────────────────────────────────────────

export class ReportCompiler {
  private templatesLoaded = false;
  private baseTemplate!: Handlebars.TemplateDelegate;
  private sectionTemplates: Map<string, Handlebars.TemplateDelegate> = new Map();
  private appendixTemplate!: Handlebars.TemplateDelegate;
  private coverTemplate!: Handlebars.TemplateDelegate;
  private css = '';

  /**
   * Compile PPI report data to HTML.
   */
  async compile(data: PpiReportData): Promise<string> {
    await this.ensureTemplatesLoaded();

    // Render each section
    const sectionNames = [
      '05-site-ground',
      '06-exterior',
      '07-interior',
      '08-services',
    ];

    const renderedSections: string[] = [];

    for (const name of sectionNames) {
      const template = this.sectionTemplates.get(name);
      if (template) {
        renderedSections.push(template(data));
      }
    }

    // Render photo appendix
    const appendixContent = this.appendixTemplate(data);

    // Render cover page
    const coverContent = this.coverTemplate(data);

    // Render base template with all content
    return this.baseTemplate({
      ...data,
      css: this.css,
      cover: coverContent,
      sections: renderedSections.join('\n'),
      appendixContent,
    });
  }

  /**
   * Load all templates and register helpers.
   */
  private async ensureTemplatesLoaded(): Promise<void> {
    if (this.templatesLoaded) return;

    // Register helpers
    this.registerHelpers();

    // Load CSS
    const cssPath = path.join(TEMPLATES_DIR, 'styles/report.css');
    this.css = await readFile(cssPath, 'utf-8');

    // Load base template
    const basePath = path.join(TEMPLATES_DIR, 'base.hbs');
    const baseSource = await readFile(basePath, 'utf-8');
    this.baseTemplate = Handlebars.compile(baseSource);

    // Load cover template
    const coverPath = path.join(TEMPLATES_DIR, 'cover.hbs');
    const coverSource = await readFile(coverPath, 'utf-8');
    this.coverTemplate = Handlebars.compile(coverSource);

    // Load section templates
    const sectionsDir = path.join(TEMPLATES_DIR, 'sections');
    const sectionFiles = await readdir(sectionsDir);

    for (const file of sectionFiles) {
      if (file.endsWith('.hbs')) {
        const name = file.replace('.hbs', '');
        const filePath = path.join(sectionsDir, file);
        const source = await readFile(filePath, 'utf-8');
        this.sectionTemplates.set(name, Handlebars.compile(source));
      }
    }

    // Load appendix template
    const appendixPath = path.join(TEMPLATES_DIR, 'appendix.hbs');
    const appendixSource = await readFile(appendixPath, 'utf-8');
    this.appendixTemplate = Handlebars.compile(appendixSource);

    // Register partials
    await this.registerPartials();

    this.templatesLoaded = true;
  }

  /**
   * Register Handlebars helpers.
   */
  private registerHelpers(): void {
    // formatDate: Convert date to DD MMM YYYY
    Handlebars.registerHelper('formatDate', (date: string | Date) => {
      const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      ];
      const d = new Date(date);
      const day = String(d.getDate()).padStart(2, '0');
      const month = months[d.getMonth()];
      const year = d.getFullYear();
      return `${day} ${month} ${year}`;
    });

    // lowercase: Convert string to lowercase
    Handlebars.registerHelper('lowercase', (str: string) => {
      if (!str) return '';
      return String(str).toLowerCase();
    });

    // decisionBadge: Render decision as styled badge
    Handlebars.registerHelper('decisionBadge', (decision: string) => {
      if (!decision) return '';
      const normalized = String(decision).toLowerCase().replace(/_/g, '-');
      const display = String(decision)
        .toLowerCase()
        .split('_')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      return new Handlebars.SafeString(
        `<span class="badge badge-${normalized}">${display}</span>`
      );
    });

    // photoRefs: Render photo reference tags
    Handlebars.registerHelper('photoRefs', (photoNumbers: number[]) => {
      if (!photoNumbers || !Array.isArray(photoNumbers) || photoNumbers.length === 0) {
        return '';
      }
      const refs = photoNumbers
        .map((n) => `<span class="photo-ref">↗ Photo ${n}</span>`)
        .join(' ');
      return new Handlebars.SafeString(refs);
    });

    // eq: Equality comparison
    Handlebars.registerHelper('eq', (a: unknown, b: unknown) => a === b);

    // inc: Increment number
    Handlebars.registerHelper('inc', (value: number) => value + 1);
  }

  /**
   * Register template partials.
   */
  private async registerPartials(): Promise<void> {
    const partialsDir = path.resolve(process.cwd(), 'templates/partials');

    try {
      const files = await readdir(partialsDir);

      for (const file of files) {
        if (file.endsWith('.hbs')) {
          const name = file.replace('.hbs', '');
          const filePath = path.join(partialsDir, file);
          const source = await readFile(filePath, 'utf-8');
          Handlebars.registerPartial(name, source);
        }
      }
    } catch {
      // Partials directory may not exist, which is fine
    }
  }
}
