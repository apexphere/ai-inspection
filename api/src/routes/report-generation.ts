/**
 * Report Generation Queue Routes
 *
 * POST   /api/reports/:id/generate              — queue a generation job (:id = inspectionId)
 * GET    /api/reports/:id/generate/status       — poll job status (:id = inspectionId)
 * DELETE /api/reports/jobs/:jobId/generate      — cancel a pending job (:jobId = GenerationJob id)
 */

import { Router, type Request, type Response, type NextFunction, type Router as RouterType } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  GenerationQueueService,
  JobNotFoundError,
  JobAlreadyActiveError,
} from '../services/generation-queue.js';

const prisma = new PrismaClient();
const queueService = new GenerationQueueService(prisma);

export const reportGenerationRouter: RouterType = Router();

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
