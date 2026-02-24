/**
 * Generated Report Storage Service (#226)
 * Manages storing and retrieving generated report files (PDF/DOCX).
 */

import { readFileSync } from 'node:fs';
import type { PrismaClient, GeneratedReport } from '@prisma/client';
import {
  uploadToR2,
  getPresignedUrl,
  isR2Configured,
} from './r2-storage.js';

export class GeneratedReportNotFoundError extends Error {
  constructor(id: string) {
    super(`Generated report not found: ${id}`);
    this.name = 'GeneratedReportNotFoundError';
  }
}

export class ReportNotFoundError extends Error {
  constructor(id: string) {
    super(`Report not found: ${id}`);
    this.name = 'ReportNotFoundError';
  }
}

const MIME_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

/**
 * Build a standardised filename for a generated report.
 * Format: {reportId[0:8]}-{type}-v{version}.{format}
 * e.g. "a1b2c3d4-COA-v2.pdf"
 */
export function buildFilename(
  reportId: string,
  type: string,
  version: number,
  format: string
): string {
  const slug = reportId.replace(/-/g, '').slice(0, 8);
  const safeType = type.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return `${slug}-${safeType}-v${version}.${format}`;
}

/**
 * Build the R2 storage key for a generated report.
 * Format: reports/{reportId}/{filename}
 */
function buildR2Key(reportId: string, filename: string): string {
  return `reports/${reportId}/${filename}`;
}

export class GeneratedReportService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Store a generated report file and create a DB record.
   * Uploads to R2 if configured, otherwise falls back to localPath.
   */
  async store(params: {
    reportId: string;
    format: string;
    localPath: string;
    pageCount?: number;
    photoCount?: number;
  }): Promise<GeneratedReport> {
    const report = await this.prisma.report.findUnique({
      where: { id: params.reportId },
    });
    if (!report) throw new ReportNotFoundError(params.reportId);

    const filename = buildFilename(
      params.reportId,
      report.type,
      report.version,
      params.format
    );

    let r2Key: string | null = null;
    let fileSize: number | null = null;

    // Read file for upload + size
    const fileBuffer = readFileSync(params.localPath);
    fileSize = fileBuffer.length;

    // Upload to R2 if configured
    if (isR2Configured()) {
      r2Key = buildR2Key(params.reportId, filename);
      const contentType = MIME_TYPES[params.format] ?? 'application/octet-stream';
      await uploadToR2(r2Key, fileBuffer, contentType);
    }

    return this.prisma.generatedReport.create({
      data: {
        reportId: params.reportId,
        format: params.format,
        filename,
        r2Key,
        localPath: r2Key ? null : params.localPath, // prefer R2
        fileSize,
        pageCount: params.pageCount ?? null,
        photoCount: params.photoCount ?? null,
        version: report.version,
      },
    });
  }

  /**
   * List all generated files for a report (newest first).
   */
  async listByReport(reportId: string): Promise<GeneratedReport[]> {
    const report = await this.prisma.report.findUnique({ where: { id: reportId } });
    if (!report) throw new ReportNotFoundError(reportId);

    return this.prisma.generatedReport.findMany({
      where: { reportId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get a download URL for a generated report.
   * Returns a presigned R2 URL if available, otherwise the local path.
   */
  async getDownloadUrl(generatedReportId: string): Promise<{
    url: string;
    filename: string;
    contentType: string;
    fileSize: number | null;
  }> {
    const gr = await this.prisma.generatedReport.findUnique({
      where: { id: generatedReportId },
    });
    if (!gr) throw new GeneratedReportNotFoundError(generatedReportId);

    const contentType = MIME_TYPES[gr.format] ?? 'application/octet-stream';

    if (gr.r2Key) {
      const url = await getPresignedUrl(gr.r2Key);
      return { url, filename: gr.filename, contentType, fileSize: gr.fileSize };
    }

    if (gr.localPath) {
      // Local fallback — caller streams the file directly
      return {
        url: gr.localPath,
        filename: gr.filename,
        contentType,
        fileSize: gr.fileSize,
      };
    }

    throw new Error(`Generated report ${generatedReportId} has no storage location`);
  }

  /**
   * Get the latest generated file for a report by format.
   */
  async getLatest(reportId: string, format: string): Promise<GeneratedReport | null> {
    return this.prisma.generatedReport.findFirst({
      where: { reportId, format },
      orderBy: { createdAt: 'desc' },
    });
  }
}
