/**
 * Report Type Routing — Issue #548
 *
 * Maps ReportType enum values to template engine directory names
 * and validates template availability.
 */

import type { ReportType } from '@prisma/client';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.resolve(__dirname, '../../templates');

/**
 * Map from Prisma ReportType enum to template directory name.
 */
const REPORT_TYPE_TO_TEMPLATE_DIR: Record<ReportType, string> = {
  COA: 'coa',
  CCC_GAP: 'ccc',
  PPI: 'ppi',
  SAFE_SANITARY: 'ss',
  TFA: 'tfa',
};

export class UnsupportedReportTypeError extends Error {
  constructor(reportType: string) {
    super(`Unsupported report type: ${reportType}`);
    this.name = 'UnsupportedReportTypeError';
  }
}

export class TemplateNotAvailableError extends Error {
  constructor(reportType: string, templateDir: string) {
    super(
      `Templates not available for report type ${reportType}. ` +
      `Expected template directory: ${templateDir}`
    );
    this.name = 'TemplateNotAvailableError';
  }
}

/**
 * Get the template directory name for a report type.
 */
export function getTemplateDir(reportType: ReportType): string {
  const dir = REPORT_TYPE_TO_TEMPLATE_DIR[reportType];
  if (!dir) {
    throw new UnsupportedReportTypeError(reportType);
  }
  return dir;
}

/**
 * Check whether templates exist for a report type.
 * Returns the template directory name if available,
 * throws TemplateNotAvailableError if not.
 */
export async function validateTemplatesExist(
  reportType: ReportType,
): Promise<string> {
  const dir = getTemplateDir(reportType);
  const fullPath = path.join(TEMPLATES_DIR, dir);

  try {
    const stat = await fs.stat(fullPath);
    if (!stat.isDirectory()) {
      throw new TemplateNotAvailableError(reportType, fullPath);
    }

    // Check for base.hbs
    await fs.access(path.join(fullPath, 'base.hbs'));

    // Check for at least one section
    const sectionsDir = path.join(fullPath, 'sections');
    const sections = await fs.readdir(sectionsDir);
    const hbsFiles = sections.filter((f) => f.endsWith('.hbs'));
    if (hbsFiles.length === 0) {
      throw new TemplateNotAvailableError(reportType, fullPath);
    }

    return dir;
  } catch (error) {
    if (error instanceof TemplateNotAvailableError) throw error;
    throw new TemplateNotAvailableError(reportType, fullPath);
  }
}

/**
 * List all report types that have templates available.
 */
export async function listAvailableReportTypes(): Promise<ReportType[]> {
  const available: ReportType[] = [];

  for (const [reportType, dir] of Object.entries(REPORT_TYPE_TO_TEMPLATE_DIR)) {
    const fullPath = path.join(TEMPLATES_DIR, dir);
    try {
      await fs.access(path.join(fullPath, 'base.hbs'));
      available.push(reportType as ReportType);
    } catch {
      // Not available
    }
  }

  return available;
}
