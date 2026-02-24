/**
 * Template Engine Service — Issue #193
 *
 * Handlebars-based template engine for rendering COA report HTML.
 * Loads templates from the filesystem, registers helpers and partials,
 * and renders a complete report HTML string from a data context.
 */

import Handlebars from 'handlebars';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, basename, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TEMPLATES_DIR = join(__dirname, '..', 'templates');

export class TemplateNotFoundError extends Error {
  constructor(name: string) {
    super(`Template not found: ${name}`);
    this.name = 'TemplateNotFoundError';
  }
}

export interface TemplateEngineOptions {
  templatesDir?: string;
}

export class TemplateEngine {
  private handlebars: typeof Handlebars;
  private templatesDir: string;
  private initialized = false;

  constructor(options?: TemplateEngineOptions) {
    this.handlebars = Handlebars.create();
    this.templatesDir = options?.templatesDir ?? TEMPLATES_DIR;
  }

  /**
   * Initialize the engine: register helpers and partials.
   * Safe to call multiple times (idempotent).
   */
  init(): void {
    if (this.initialized) return;
    this.registerHelpers();
    this.registerPartials();
    this.initialized = true;
  }

  /**
   * Render a report type (e.g. "coa") with the given data context.
   * Returns the complete HTML string.
   */
  render(reportType: string, context: Record<string, unknown>): string {
    this.init();

    const baseTemplatePath = join(this.templatesDir, reportType, 'base.hbs');
    if (!existsSync(baseTemplatePath)) {
      throw new TemplateNotFoundError(`${reportType}/base.hbs`);
    }

    // Load and inject CSS
    const cssPath = join(this.templatesDir, reportType, 'styles', 'report.css');
    const styles = existsSync(cssPath) ? readFileSync(cssPath, 'utf-8') : '';

    const source = readFileSync(baseTemplatePath, 'utf-8');
    const template = this.handlebars.compile(source);

    return template({ ...context, styles });
  }

  /**
   * Render a single section template (for preview).
   */
  renderSection(reportType: string, sectionName: string, context: Record<string, unknown>): string {
    this.init();

    const sectionPath = join(this.templatesDir, reportType, 'sections', `${sectionName}.hbs`);
    if (!existsSync(sectionPath)) {
      throw new TemplateNotFoundError(`${reportType}/sections/${sectionName}.hbs`);
    }

    const source = readFileSync(sectionPath, 'utf-8');
    const template = this.handlebars.compile(source);
    return template(context);
  }

  /**
   * List available report types (directories under templates/).
   */
  listReportTypes(): string[] {
    return readdirSync(this.templatesDir, { withFileTypes: true })
      .filter((d) => d.isDirectory() && d.name !== 'partials')
      .map((d) => d.name);
  }

  /**
   * List sections for a report type.
   */
  listSections(reportType: string): string[] {
    const sectionsDir = join(this.templatesDir, reportType, 'sections');
    if (!existsSync(sectionsDir)) return [];
    return readdirSync(sectionsDir)
      .filter((f) => f.endsWith('.hbs'))
      .map((f) => basename(f, '.hbs'))
      .sort();
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Helpers
  // ────────────────────────────────────────────────────────────────────────────

  private registerHelpers(): void {
    // Format date to "dd MMMM yyyy" (e.g. "15 February 2026")
    this.handlebars.registerHelper('formatDate', (date: string | Date) => {
      if (!date) return '';
      const d = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(d.getTime())) return String(date);
      const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December',
      ];
      return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    });

    // Photo reference: [1, 3, 5] → "Photograph 1, 3, 5"
    this.handlebars.registerHelper('photoRef', (photoRefs: string[] | number[]) => {
      if (!photoRefs || !Array.isArray(photoRefs) || photoRefs.length === 0) return '';
      return `Photograph ${photoRefs.join(', ')}`;
    });

    // Conditional for applicability
    this.handlebars.registerHelper('ifApplicable', function (
      this: unknown,
      applicability: string,
      options: Handlebars.HelperOptions,
    ) {
      return applicability === 'Applicable'
        ? options.fn(this)
        : options.inverse(this);
    });

    // CSS class for clause row
    this.handlebars.registerHelper('clauseClass', (applicability: string) => {
      return applicability === 'N/A' ? 'clause-na' : 'clause-applicable';
    });

    // Increment index (for 1-based numbering)
    this.handlebars.registerHelper('inc', (value: number) => {
      return value + 1;
    });

    // Equality check
    this.handlebars.registerHelper('eq', (a: unknown, b: unknown) => {
      return a === b;
    });
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Partials
  // ────────────────────────────────────────────────────────────────────────────

  private registerPartials(): void {
    // Register shared partials
    this.registerPartialsFromDir(join(this.templatesDir, 'partials'));

    // Register report-type-specific partials (sections + appendices)
    const reportTypes = this.listReportTypes();
    for (const type of reportTypes) {
      const sectionsDir = join(this.templatesDir, type, 'sections');
      this.registerPartialsFromDir(sectionsDir);

      const appendicesDir = join(this.templatesDir, type, 'appendices');
      this.registerPartialsFromDir(appendicesDir, 'appendix-');
    }
  }

  private registerPartialsFromDir(dir: string, prefix = ''): void {
    if (!existsSync(dir)) return;

    for (const file of readdirSync(dir)) {
      if (!file.endsWith('.hbs')) continue;
      const name = prefix + basename(file, extname(file));
      const source = readFileSync(join(dir, file), 'utf-8');
      this.handlebars.registerPartial(name, source);
    }
  }
}
