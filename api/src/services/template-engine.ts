/**
 * Handlebars Template Engine — Issue #193
 *
 * Renders HTML from Handlebars templates for report generation.
 * Templates live in api/templates/ with per-report-type subdirectories.
 */

import Handlebars from 'handlebars';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.resolve(__dirname, '../../templates');

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

export interface TemplateRenderOptions {
  /** Report type directory (e.g. 'coa') */
  reportType: string;
  /** Template data context */
  data: Record<string, unknown>;
}

export class TemplateNotFoundError extends Error {
  constructor(templatePath: string) {
    super(`Template not found: ${templatePath}`);
    this.name = 'TemplateNotFoundError';
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

function registerHelpers(): void {
  Handlebars.registerHelper('formatDate', (date: Date | string) => {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-NZ', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  });

  Handlebars.registerHelper('photoRef', (photoRefs: string[] | undefined) => {
    if (!photoRefs || photoRefs.length === 0) return '—';
    return photoRefs.map((ref) => `Photograph ${ref}`).join(', ');
  });

  Handlebars.registerHelper('ifApplicable', function (
    this: unknown,
    applicability: string,
    options: Handlebars.HelperOptions,
  ) {
    return applicability === 'Applicable'
      ? options.fn(this)
      : options.inverse(this);
  });

  Handlebars.registerHelper('clauseClass', (applicability: string) => {
    return applicability === 'N/A' ? 'clause-na' : 'clause-applicable';
  });

  Handlebars.registerHelper('eq', (a: unknown, b: unknown) => a === b);

  Handlebars.registerHelper('unless_last', function (
    this: unknown,
    options: Handlebars.HelperOptions,
  ) {
    const data = options.data as { last?: boolean };
    return data?.last ? '' : options.fn(this);
  });

  Handlebars.registerHelper('inc', (value: number) => value + 1);

  Handlebars.registerHelper('uppercase', (value: string) =>
    value ? value.toUpperCase() : '',
  );

  Handlebars.registerHelper('lowercase', (value: string) =>
    value ? value.toLowerCase() : '',
  );

  Handlebars.registerHelper('join', (arr: string[], separator: string) => {
    if (!Array.isArray(arr)) return '';
    return arr.join(typeof separator === 'string' ? separator : ', ');
  });
}

// ──────────────────────────────────────────────────────────────────────────────
// Engine
// ──────────────────────────────────────────────────────────────────────────────

let _initialized = false;

async function loadPartials(): Promise<void> {
  const partialsDir = path.join(TEMPLATES_DIR, 'partials');

  try {
    const files = await fs.readdir(partialsDir);
    for (const file of files) {
      if (!file.endsWith('.hbs')) continue;
      const name = path.basename(file, '.hbs');
      const content = await fs.readFile(path.join(partialsDir, file), 'utf-8');
      Handlebars.registerPartial(name, content);
    }
  } catch {
    // No partials directory — that's fine
  }
}

async function init(): Promise<void> {
  if (_initialized) return;
  registerHelpers();
  await loadPartials();
  _initialized = true;
}

/**
 * Read and compile a single template file.
 */
async function compileTemplate(
  templatePath: string,
): Promise<HandlebarsTemplateDelegate> {
  const fullPath = path.join(TEMPLATES_DIR, templatePath);
  try {
    const source = await fs.readFile(fullPath, 'utf-8');
    return Handlebars.compile(source);
  } catch {
    throw new TemplateNotFoundError(templatePath);
  }
}

/**
 * Render the base layout with all sections inlined.
 */
export async function renderReport(
  options: TemplateRenderOptions,
): Promise<string> {
  await init();

  const { reportType, data } = options;

  // Load base template
  const baseTemplate = await compileTemplate(`${reportType}/base.hbs`);

  // Load section templates
  const sectionsDir = path.join(TEMPLATES_DIR, reportType, 'sections');
  const sectionFiles = await fs.readdir(sectionsDir);
  const sectionHtmls: string[] = [];

  for (const file of sectionFiles.sort()) {
    if (!file.endsWith('.hbs')) continue;
    const sectionTemplate = await compileTemplate(
      `${reportType}/sections/${file}`,
    );
    sectionHtmls.push(sectionTemplate(data));
  }

  // Load appendix templates
  const appendicesDir = path.join(TEMPLATES_DIR, reportType, 'appendices');
  const appendixHtmls: string[] = [];
  try {
    const appendixFiles = await fs.readdir(appendicesDir);
    for (const file of appendixFiles.sort()) {
      if (!file.endsWith('.hbs')) continue;
      const appendixTemplate = await compileTemplate(
        `${reportType}/appendices/${file}`,
      );
      appendixHtmls.push(appendixTemplate(data));
    }
  } catch {
    // No appendices — fine
  }

  // Load CSS
  let css = '';
  try {
    css = await fs.readFile(
      path.join(TEMPLATES_DIR, reportType, 'styles', 'report.css'),
      'utf-8',
    );
  } catch {
    // No CSS — fine
  }

  // Render base with sections injected
  return baseTemplate({
    ...data,
    sections: sectionHtmls.join('\n'),
    appendixContent: appendixHtmls.join('\n'),
    css,
  });
}

/**
 * Render a single section template (for preview).
 */
export async function renderSection(
  reportType: string,
  sectionFile: string,
  data: Record<string, unknown>,
): Promise<string> {
  await init();
  const template = await compileTemplate(
    `${reportType}/sections/${sectionFile}`,
  );
  return template(data);
}

/**
 * List available templates for a report type.
 */
export async function listTemplates(
  reportType: string,
): Promise<{ sections: string[]; appendices: string[] }> {
  const sectionsDir = path.join(TEMPLATES_DIR, reportType, 'sections');
  const appendicesDir = path.join(TEMPLATES_DIR, reportType, 'appendices');

  const sections: string[] = [];
  const appendices: string[] = [];

  try {
    const files = await fs.readdir(sectionsDir);
    sections.push(...files.filter((f) => f.endsWith('.hbs')).sort());
  } catch {
    // No sections
  }

  try {
    const files = await fs.readdir(appendicesDir);
    appendices.push(...files.filter((f) => f.endsWith('.hbs')).sort());
  } catch {
    // No appendices
  }

  return { sections, appendices };
}

// Re-export for testing
export { TEMPLATES_DIR, registerHelpers, init };
