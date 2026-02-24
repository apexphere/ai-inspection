/**
 * Review Comment Routes — Issue #211
 *
 * CRUD for review comments on reports.
 *
 * POST   /api/reports/:reportId/comments            — add a comment
 * GET    /api/reports/:reportId/comments             — list comments (filter: status, priority, authorId)
 * GET    /api/reports/:reportId/comments/:id         — get single comment
 * PATCH  /api/reports/:reportId/comments/:id         — update a comment (prefer /resolve and /reopen for status changes)
 * POST   /api/reports/:reportId/comments/:id/resolve — resolve a comment
 * POST   /api/reports/:reportId/comments/:id/reopen  — reopen a comment
 * DELETE /api/reports/:reportId/comments/:id         — delete a comment
 */

import { Router, type Request, type Response, type NextFunction, type Router as RouterType } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { PrismaReviewCommentRepository } from '../repositories/prisma/review-comment.js';
import { ReviewCommentService, ReviewCommentNotFoundError } from '../services/review-comment.js';

const prisma = new PrismaClient();
const repository = new PrismaReviewCommentRepository(prisma);
const service = new ReviewCommentService(repository);

export const reviewCommentsRouter: RouterType = Router();

// ──────────────────────────────────────────────────────────────────────────────
// Validation schemas
// ──────────────────────────────────────────────────────────────────────────────

const PriorityValues = ['LOW', 'MEDIUM', 'HIGH'] as const;
const StatusValues = ['OPEN', 'RESOLVED'] as const;

const CreateCommentSchema = z.object({
  authorId: z.string().uuid('authorId must be a valid UUID'),
  section: z.string().min(1).optional(),
  content: z.string().min(1, 'content is required'),
  priority: z.enum(PriorityValues).default('MEDIUM'),
});

const UpdateCommentSchema = z.object({
  content: z.string().min(1).optional(),
  section: z.string().min(1).nullable().optional(),
  priority: z.enum(PriorityValues).optional(),
  status: z.enum(StatusValues).optional(),
});

const ListQuerySchema = z.object({
  status: z.enum(StatusValues).optional(),
  priority: z.enum(PriorityValues).optional(),
  authorId: z.string().uuid().optional(),
});

// ──────────────────────────────────────────────────────────────────────────────
// Routes
// ──────────────────────────────────────────────────────────────────────────────

/** POST /api/reports/:reportId/comments */
reviewCommentsRouter.post(
  '/reports/:reportId/comments',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = CreateCommentSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors });
        return;
      }

      const comment = await service.create({
        reportId: req.params.reportId as string,
        ...parsed.data,
      });

      res.status(201).json(comment);
    } catch (error) {
      next(error);
    }
  }
);

/** GET /api/reports/:reportId/comments */
reviewCommentsRouter.get(
  '/reports/:reportId/comments',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = ListQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors });
        return;
      }

      const comments = await service.list({
        reportId: req.params.reportId as string,
        ...parsed.data,
      });

      res.json(comments);
    } catch (error) {
      next(error);
    }
  }
);

/** GET /api/reports/:reportId/comments/:id */
reviewCommentsRouter.get(
  '/reports/:reportId/comments/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const comment = await service.getById(req.params.id as string);
      res.json(comment);
    } catch (error) {
      if (error instanceof ReviewCommentNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }
);

/** PATCH /api/reports/:reportId/comments/:id */
reviewCommentsRouter.patch(
  '/reports/:reportId/comments/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = UpdateCommentSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors });
        return;
      }

      const comment = await service.update(req.params.id as string, parsed.data);
      res.json(comment);
    } catch (error) {
      if (error instanceof ReviewCommentNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }
);

/** POST /api/reports/:reportId/comments/:id/resolve */
reviewCommentsRouter.post(
  '/reports/:reportId/comments/:id/resolve',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const comment = await service.resolve(req.params.id as string);
      res.json(comment);
    } catch (error) {
      if (error instanceof ReviewCommentNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }
);

/** POST /api/reports/:reportId/comments/:id/reopen */
reviewCommentsRouter.post(
  '/reports/:reportId/comments/:id/reopen',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const comment = await service.reopen(req.params.id as string);
      res.json(comment);
    } catch (error) {
      if (error instanceof ReviewCommentNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }
);

/** DELETE /api/reports/:reportId/comments/:id */
reviewCommentsRouter.delete(
  '/reports/:reportId/comments/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await service.delete(req.params.id as string);
      res.status(204).send();
    } catch (error) {
      if (error instanceof ReviewCommentNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }
);
