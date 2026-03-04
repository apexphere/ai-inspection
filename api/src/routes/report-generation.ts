/**
 * Report Generation Queue Routes
 *
 * POST   /api/reports/:id/generate              — queue a generation job (:id = inspectionId)
 * GET    /api/reports/:id/generate/status       — poll job status (:id = inspectionId)
 * DELETE /api/reports/jobs/:jobId/generate      — cancel a pending job (:jobId = GenerationJob id)
 * POST   /api/reports/:id/generate/docx         — generate DOCX from report data (:id = reportId)
 */

import { Router, type Request, type Response, type NextFunction, type Router as RouterType } from 'express';
import { PrismaClient } from '@prisma/client';
import path from 'node:path';
import {
  GenerationQueueService,
  JobNotFoundError,
  JobAlreadyActiveError,
} from '../services/generation-queue.js';
import { DocxGeneratorService } from '../services/docx-generator.js';
import type { DocxReportData } from '../services/docx-generator.js';

const prisma = new PrismaClient();
const queueService = new GenerationQueueService(prisma);


async function getInspectionIdByProjectId(projectId: string): Promise<string | null> {
  const inspection = await prisma.siteInspection.findFirst({
    where: { projectId },
    orderBy: { date: 'desc' },
  });
  return inspection?.id ?? null;
}

export const reportGenerationRouter: RouterType = Router();


/**
 * POST /api/projects/:projectId/report/generate
 * Queue a report generation job for a project (internal inspection lookup).
 */
reportGenerationRouter.post(
  '/projects/:projectId/report/generate',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const projectId = req.params.projectId as string;
      const inspectionId = await getInspectionIdByProjectId(projectId);
      if (!inspectionId) {
        res.status(404).json({ error: `No inspection found for project: ${projectId}` });
        return;
      }
      const result = await queueService.enqueue(inspectionId);

      res.status(202).json({
        jobId: result.jobId,
        projectId,
        status: result.status,
        message: 'Report generation queued',
      });
    } catch (error) {
      if (error instanceof JobAlreadyActiveError) {
        res.status(409).json({ error: error.message });
        return;
      }
      next(error);
    }
  }
);

/**
 * GET /api/projects/:projectId/report/status
 * Poll the status of the latest generation job for a project.
 */
reportGenerationRouter.get(
  '/projects/:projectId/report/status',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const projectId = req.params.projectId as string;
      const inspectionId = await getInspectionIdByProjectId(projectId);
      if (!inspectionId) {
        res.status(404).json({ error: `No inspection found for project: ${projectId}` });
        return;
      }
      const job = await queueService.getLatestByInspection(inspectionId);

      if (!job) {
        res.status(404).json({ error: `No generation job found for project: ${projectId}` });
        return;
      }

      const report = await prisma.report.findFirst({
        where: { siteInspectionId: inspectionId, pdfPath: { not: null } },
        orderBy: { updatedAt: 'desc' },
      });

      res.json({ ...job, projectId, reportId: report?.id ?? null });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/reports/:id/generate
 * Queue a report generation job for an inspection.
 * :id is the inspectionId.
 */
reportGenerationRouter.post(
  '/reports/:id/generate',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const inspectionId = req.params.id as string;
      const result = await queueService.enqueue(inspectionId);

      res.status(202).json({
        jobId: result.jobId,
        inspectionId,
        status: result.status,
        message: 'Report generation queued',
      });
    } catch (error) {
      if (error instanceof JobAlreadyActiveError) {
        res.status(409).json({ error: error.message });
        return;
      }
      next(error);
    }
  }
);

/**
 * GET /api/reports/:id/generate/status
 * Poll the status of the latest generation job for an inspection.
 * :id is the inspectionId.
 */
reportGenerationRouter.get(
  '/reports/:id/generate/status',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const inspectionId = req.params.id as string;
      const job = await queueService.getLatestByInspection(inspectionId);

      if (!job) {
        res.status(404).json({ error: `No generation job found for inspection: ${inspectionId}` });
        return;
      }

      res.json(job);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/reports/jobs/:jobId/generate
 * Cancel a pending generation job by job ID.
 */
reportGenerationRouter.delete(
  '/reports/jobs/:jobId/generate',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const jobId = req.params.jobId as string;
      await queueService.cancel(jobId);

      res.json({ jobId, status: 'CANCELLED', message: 'Job cancelled' });
    } catch (error) {
      if (error instanceof JobNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      if (error instanceof Error && error.message.startsWith('Cannot cancel')) {
        res.status(409).json({ error: error.message });
        return;
      }
      next(error);
    }
  }
);


/**
 * GET /api/reports/:reportId/download
 * Download generated PDF for a report.
 */
reportGenerationRouter.get(
  '/reports/:id/download',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const reportId = req.params.id as string;
      const report = await prisma.report.findUnique({ where: { id: reportId } });

      if (!report || !report.pdfPath) {
        res.status(404).json({ error: 'Report PDF not found' });
        return;
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${reportId}.pdf"`);
      res.sendFile(path.resolve(report.pdfPath), (err) => {
        if (err) {
          res.status(404).json({ error: 'File not found' });
        }
      });
    } catch (error) {
      next(error);
    }
  }
);


/**
 * POST /api/projects/:projectId/report/generate
 * Queue a report generation job for a project (internal inspection lookup).
 */
reportGenerationRouter.post(
  '/projects/:projectId/report/generate',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const projectId = req.params.projectId as string;
      const inspectionId = await getInspectionIdByProjectId(projectId);
      if (!inspectionId) {
        res.status(404).json({ error: `No inspection found for project: ${projectId}` });
        return;
      }
      const result = await queueService.enqueue(inspectionId);

      res.status(202).json({
        jobId: result.jobId,
        projectId,
        status: result.status,
        message: 'Report generation queued',
      });
    } catch (error) {
      if (error instanceof JobAlreadyActiveError) {
        res.status(409).json({ error: error.message });
        return;
      }
      next(error);
    }
  }
);

/**
 * GET /api/projects/:projectId/report/status
 * Poll the status of the latest generation job for a project.
 */
reportGenerationRouter.get(
  '/projects/:projectId/report/status',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const projectId = req.params.projectId as string;
      const inspectionId = await getInspectionIdByProjectId(projectId);
      if (!inspectionId) {
        res.status(404).json({ error: `No inspection found for project: ${projectId}` });
        return;
      }
      const job = await queueService.getLatestByInspection(inspectionId);

      if (!job) {
        res.status(404).json({ error: `No generation job found for project: ${projectId}` });
        return;
      }

      const report = await prisma.report.findFirst({
        where: { siteInspectionId: inspectionId, pdfPath: { not: null } },
        orderBy: { updatedAt: 'desc' },
      });

      res.json({ ...job, projectId, reportId: report?.id ?? null });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/reports/:id/generate/docx
 * Generate a DOCX document from report data.
 * :id is the reportId.
 * Body should contain DocxReportData structure.
 */
reportGenerationRouter.post(
  '/reports/:id/generate/docx',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const reportId = req.params.id as string;
      const reportData = req.body as DocxReportData;

      // Validate required fields
      if (!reportData.companyName || !reportData.reportTitle || !reportData.address) {
        res.status(400).json({
          error: 'Missing required fields: companyName, reportTitle, and address are required',
        });
        return;
      }

      const docxService = new DocxGeneratorService();
      const outputPath = `/tmp/report-${reportId}-${Date.now()}.docx`;

      const result = await docxService.generate({
        reportData,
        outputPath,
      });

      res.status(201).json({
        reportId,
        format: 'docx',
        outputPath: result.outputPath,
        fileSize: result.fileSize,
        message: 'DOCX report generated successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);
