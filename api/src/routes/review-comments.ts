/**
 * Review Comment Routes — Issue #211
 *
 * CRUD for review comments on reports.
 *
 * POST   /api/reports/:reportId/comments            — add a comment
 * GET    /api/reports/:reportId/comments             — list comments (filter: status, priority, authorId)
 * GET    /api/reports/:reportId/comments/:id         — get single comment
 * PATCH  /api/reports/:reportId/comments/:id         — update a comment
 * POST   /api/reports/:reportId/comments/:id/resolve — resolve a comment
 * POST   /api/reports/:reportId/comments/:id/reopen  — reopen a comment
 * DELETE /api/reports/:reportId/comments/:id         — delete a comment
 */

import { Router, type Request, type Response, type NextFunction, type Router as RouterType } from 'express';
import { PrismaClient } from '@prisma/client';
import { PrismaReviewCommentRepository } from '../repositories/prisma/review-comment.js';
import { ReviewCommentService, ReviewCommentNotFoundError } from '../services/review-comment.js';

const prisma = new PrismaClient();
const repository = new PrismaReviewCommentRepository(prisma);
const service = new ReviewCommentService(repository);

export const reviewCommentsRouter: RouterType = Router();

/** POST /api/reports/:reportId/comments */
reviewCommentsRouter.post(
  '/reports/:reportId/comments',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { reportId } = req.params;
      const { authorId, section, content, priority } = req.body;

      if (!authorId || !content) {
        res.status(400).json({ error: 'authorId and content are required' });
        return;
      }

      const comment = await service.create({
        reportId: reportId as string,
        authorId,
        section,
        content,
        priority,
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
      const { reportId } = req.params;
      const { status, priority, authorId } = req.query;

      const comments = await service.list({
        reportId: reportId as string,
        ...(status && { status: status as 'OPEN' | 'RESOLVED' }),
        ...(priority && { priority: priority as 'LOW' | 'MEDIUM' | 'HIGH' }),
        ...(authorId && { authorId: authorId as string }),
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
      const { content, section, priority, status } = req.body;
      const comment = await service.update(req.params.id as string, {
        content,
        section,
        priority,
        status,
      });
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
