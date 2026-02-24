/**
 * Report Transition Routes — Issue #210
 * 
 * Endpoints for report status transitions with role validation.
 */

import { Router, type Request, type Response, type NextFunction, type Router as RouterType } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import {
  ReportStateMachine,
  InvalidTransitionError,
  InsufficientRoleError,
  type ReportRole,
} from '../services/report-state-machine.js';

const prisma = new PrismaClient();
const stateMachine = new ReportStateMachine();

export const reportTransitionsRouter: RouterType = Router();

// Validation schemas
const TransitionSchema = z.object({
  action: z.enum(['submitForReview', 'requestChanges', 'approve', 'finalize', 'markSubmitted']),
  role: z.enum(['AUTHOR', 'REVIEWER', 'ADMIN']),
  userId: z.string().min(1, 'userId is required'),
});

/**
 * POST /api/reports/:id/transition — Execute a status transition
 */
reportTransitionsRouter.post('/:id/transition', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reportId = req.params.id as string;

    const parsed = TransitionSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const { action, role, userId } = parsed.data;

    // Find the report
    const report = await prisma.report.findUnique({ where: { id: reportId } });
    if (!report) {
      res.status(404).json({ error: 'Report not found' });
      return;
    }

    // Execute the transition (validates status + role)
    const newStatus = stateMachine.executeAction(report.status, action, role as ReportRole);

    // Update the report status
    const updated = await prisma.report.update({
      where: { id: reportId },
      data: {
        status: newStatus,
        ...(action === 'approve' ? { reviewedById: userId, reviewedAt: new Date() } : {}),
      },
      include: {
        siteInspection: {
          include: {
            project: {
              include: {
                property: true,
                client: true,
              },
            },
          },
        },
      },
    });

    // Record the transition in audit log
    await prisma.reportAuditLog.create({
      data: {
        reportId,
        action: 'STATUS_CHANGED',
        userId,
        changes: {
          from: report.status,
          to: newStatus,
          action,
          role,
        },
      },
    });

    res.json({
      report: updated,
      transition: {
        from: report.status,
        to: newStatus,
        action,
        performedBy: userId,
      },
    });
  } catch (error) {
    if (error instanceof InvalidTransitionError) {
      res.status(400).json({ error: error.message });
      return;
    }
    if (error instanceof InsufficientRoleError) {
      res.status(403).json({ error: error.message });
      return;
    }
    next(error);
  }
});

/**
 * GET /api/reports/:id/transitions — Get available transitions for a report
 */
reportTransitionsRouter.get('/:id/transitions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reportId = req.params.id as string;
    const role = req.query.role as string | undefined;

    const report = await prisma.report.findUnique({ where: { id: reportId } });
    if (!report) {
      res.status(404).json({ error: 'Report not found' });
      return;
    }

    const transitions = role
      ? stateMachine.getAvailableActions(report.status, role as ReportRole)
      : stateMachine.getValidTransitions(report.status);

    res.json({
      currentStatus: report.status,
      availableTransitions: transitions.map(t => ({
        action: t.action,
        targetStatus: t.to,
        allowedRoles: t.allowedRoles,
      })),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/reports/transitions/all — Get all defined transitions (documentation)
 */
reportTransitionsRouter.get('/transitions/all', (_req: Request, res: Response) => {
  const transitions = stateMachine.getAllTransitions();
  res.json(transitions.map(t => ({
    from: t.from,
    to: t.to,
    action: t.action,
    allowedRoles: t.allowedRoles,
  })));
});
