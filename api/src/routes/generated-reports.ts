import { logger } from '../lib/logger.js';
/**
 * Generated Report Storage & Download Routes (#226)
 *
 * GET  /api/reports/:id/generated          — list generated files
 * GET  /api/reports/:id/download/:format   — download latest by format
 * GET  /api/generated-reports/:id/download — download specific file
 */

import { Router } from 'express';
import { createReadStream, existsSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
import {
  GeneratedReportService,
  GeneratedReportNotFoundError,
  ReportNotFoundError,
} from '../services/generated-report.js';

const prisma = new PrismaClient();
export const generatedReportsRouter = Router();
const svc = new GeneratedReportService(prisma);
const router = generatedReportsRouter;

/**
 * GET /api/reports/:id/generated
 * List all generated files for a report.
 */
router.get('/:id/generated', async (req, res) => {
  try {
    const files = await svc.listByReport(req.params.id);
    res.json(files);
  } catch (err) {
    if (err instanceof ReportNotFoundError) {
      return res.status(404).json({ error: err.message });
    }
    logger.error({ err }, 'Generated reports list error');
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/reports/:id/download/:format
 * Download the latest generated file by format (pdf|docx).
 * Redirects to presigned R2 URL or streams local file.
 */
router.get('/:id/download/:format', async (req, res) => {
  const { id, format } = req.params;

  if (!['pdf', 'docx'].includes(format)) {
    return res.status(400).json({ error: 'Invalid format. Use pdf or docx.' });
  }

  try {
    const latest = await svc.getLatest(id, format);
    if (!latest) {
      return res.status(404).json({ error: `No generated ${format} found for this report` });
    }

    const { url, filename, contentType, fileSize } = await svc.getDownloadUrl(latest.id);

    // R2 — redirect to presigned URL
    if (latest.r2Key) {
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.redirect(302, url);
    }

    // Local — stream file
    if (latest.localPath && existsSync(latest.localPath)) {
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      if (fileSize) res.setHeader('Content-Length', fileSize);
      return createReadStream(latest.localPath).pipe(res);
    }

    res.status(404).json({ error: 'Generated file not found on disk' });
  } catch (err) {
    if (err instanceof ReportNotFoundError) {
      return res.status(404).json({ error: err.message });
    }
    logger.error({ err }, 'Generated reports download error');
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/generated-reports/:id/download
 * Download a specific generated report file by its ID.
 */
router.get('/file/:id/download', async (req, res) => {
  try {
    const { url, filename, contentType, fileSize } = await svc.getDownloadUrl(req.params.id);
    const gr = await prisma.generatedReport.findUnique({ where: { id: req.params.id } });

    // R2 redirect
    if (gr?.r2Key) {
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.redirect(302, url);
    }

    // Local stream
    if (gr?.localPath && existsSync(gr.localPath)) {
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      if (fileSize) res.setHeader('Content-Length', fileSize);
      return createReadStream(gr.localPath).pipe(res);
    }

    res.status(404).json({ error: 'File not found' });
  } catch (err) {
    if (err instanceof GeneratedReportNotFoundError) {
      return res.status(404).json({ error: err.message });
    }
    logger.error({ err }, 'Generated reports file download error');
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
