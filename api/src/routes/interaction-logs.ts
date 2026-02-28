/**
 * Interaction Logs API Routes
 * Issue #512 - Interaction Observability
 * 
 * Internal API for logging AI interactions. Access restricted to service calls only.
 */

import { Router, type Request, type Response, type NextFunction, type Router as RouterType } from 'express';
import { z } from 'zod';
import { PrismaClient, type InteractionEventType, type Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export const interactionLogsRouter: RouterType = Router();

// Validation schemas
const CreateLogSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  eventType: z.enum(['USER_INPUT', 'AI_INTERPRETATION', 'TOOL_CALL', 'TOOL_RESULT', 'AI_RESPONSE']),
  content: z.record(z.unknown()),
  metadata: z.record(z.unknown()).optional(),
});

const BatchCreateLogSchema = z.object({
  logs: z.array(CreateLogSchema).min(1).max(100),
});

const QueryLogsSchema = z.object({
  sessionId: z.string().optional(),
  eventType: z.enum(['USER_INPUT', 'AI_INTERPRETATION', 'TOOL_CALL', 'TOOL_RESULT', 'AI_RESPONSE']).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  limit: z.coerce.number().min(1).max(1000).default(100),
  offset: z.coerce.number().min(0).default(0),
});

// POST /api/interaction-logs - Create single log entry
interactionLogsRouter.post(
  '/',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = CreateLogSchema.safeParse(req.body);

      if (!parsed.success) {
        res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.flatten().fieldErrors,
        });
        return;
      }

      const log = await prisma.interactionLog.create({
        data: {
          sessionId: parsed.data.sessionId,
          eventType: parsed.data.eventType as InteractionEventType,
          content: parsed.data.content as Prisma.InputJsonValue,
          metadata: parsed.data.metadata as Prisma.InputJsonValue | undefined,
        },
      });

      res.status(201).json(log);
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/interaction-logs/batch - Create multiple log entries
interactionLogsRouter.post(
  '/batch',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = BatchCreateLogSchema.safeParse(req.body);

      if (!parsed.success) {
        res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.flatten().fieldErrors,
        });
        return;
      }

      const result = await prisma.interactionLog.createMany({
        data: parsed.data.logs.map(log => ({
          sessionId: log.sessionId,
          eventType: log.eventType as InteractionEventType,
          content: log.content as Prisma.InputJsonValue,
          metadata: log.metadata as Prisma.InputJsonValue | undefined,
        })),
      });

      res.status(201).json({ created: result.count });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/interaction-logs - Query logs
interactionLogsRouter.get(
  '/',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = QueryLogsSchema.safeParse(req.query);

      if (!parsed.success) {
        res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.flatten().fieldErrors,
        });
        return;
      }

      const { sessionId, eventType, from, to, limit, offset } = parsed.data;

      const where: Prisma.InteractionLogWhereInput = {};
      if (sessionId) where.sessionId = sessionId;
      if (eventType) where.eventType = eventType;
      if (from || to) {
        where.timestamp = {};
        if (from) where.timestamp.gte = new Date(from);
        if (to) where.timestamp.lte = new Date(to);
      }

      const [logs, total] = await Promise.all([
        prisma.interactionLog.findMany({
          where,
          orderBy: { timestamp: 'asc' },
          take: limit,
          skip: offset,
        }),
        prisma.interactionLog.count({ where }),
      ]);

      res.json({ logs, total, limit, offset });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/interaction-logs/sessions/:sessionId - Get session timeline
interactionLogsRouter.get(
  '/sessions/:sessionId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sessionId = req.params.sessionId as string;

      const logs = await prisma.interactionLog.findMany({
        where: { sessionId },
        orderBy: { timestamp: 'asc' },
      });

      res.json({ sessionId, logs, count: logs.length });
    } catch (error) {
      next(error);
    }
  }
);
