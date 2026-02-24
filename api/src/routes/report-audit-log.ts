import { Router, type Request, type Response, type NextFunction, type Router as RouterType } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { PrismaReportAuditLogRepository } from '../repositories/prisma/report-audit-log.js';
import { ReportAuditLogService, ReportAuditLogNotFoundError } from '../services/report-audit-log.js';

const prisma = new PrismaClient();
const repository = new PrismaReportAuditLogRepository(prisma);
const service = new ReportAuditLogService(repository);

export const reportAuditLogRouter: RouterType = Router();

const ReportAuditActionEnum = z.enum([
  'CREATED',
  'STATUS_CHANGED',
  'CONTENT_UPDATED',
  'VERSION_CREATED',
  'DELETED',
]);

const CreateAuditLogSchema = z.object({
  action: ReportAuditActionEnum,
  userId: z.string().uuid().optional(),
  changes: z.record(z.unknown()).optional(),
});

// POST /api/reports/:reportId/audit-log — Record an audit entry
reportAuditLogRouter.post(
  '/reports/:reportId/audit-log',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const reportId = req.params.reportId as string;
      const parsed = CreateAuditLogSchema.safeParse(req.body);

      if (!parsed.success) {
        res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.flatten().fieldErrors,
        });
        return;
      }

      const entry = await service.log({ reportId, ...parsed.data });
      res.status(201).json(entry);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/reports/:reportId/audit-log — Get history for a report
reportAuditLogRouter.get(
  '/reports/:reportId/audit-log',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const reportId = req.params.reportId as string;
      const history = await service.getHistory(reportId);
      res.json(history);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/audit-log — Query across all reports (optional filters)
reportAuditLogRouter.get(
  '/audit-log',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { reportId, action, userId, since } = req.query as Record<string, string | undefined>;

      const logs = await service.findAll({
        reportId,
        action: action ? (action as z.infer<typeof ReportAuditActionEnum>) : undefined,
        userId,
        since: since ? new Date(since) : undefined,
      });

      res.json(logs);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/audit-log/:id — Get single entry
reportAuditLogRouter.get(
  '/audit-log/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const entry = await service.findById(id);
      res.json(entry);
    } catch (error) {
      if (error instanceof ReportAuditLogNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }
);

// DELETE /api/audit-log/:id — Delete a single entry (admin)
reportAuditLogRouter.delete(
  '/audit-log/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      await service.delete(id);
      res.status(204).send();
    } catch (error) {
      if (error instanceof ReportAuditLogNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }
);
