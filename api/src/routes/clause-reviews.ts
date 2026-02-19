import { Router, type Request, type Response, type NextFunction, type Router as RouterType } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { PrismaClauseReviewRepository } from '../repositories/prisma/clause-review.js';
import { ClauseReviewService, ClauseReviewNotFoundError } from '../services/clause-review.js';

const prisma = new PrismaClient();
const repository = new PrismaClauseReviewRepository(prisma);
const service = new ClauseReviewService(repository);

export const clauseReviewsRouter: RouterType = Router();

// Enums
const applicabilityValues = ['APPLICABLE', 'NA'] as const;

// Validation schemas
const CreateClauseReviewSchema = z.object({
  clauseId: z.string().uuid('Invalid clause ID'),
  applicability: z.enum(applicabilityValues),
  naReason: z.string().optional(),
  observations: z.string().optional(),
  photoIds: z.array(z.string()).optional(),
  docIds: z.array(z.string()).optional(),
  docsRequired: z.string().optional(),
  remedialWorks: z.string().optional(),
  sortOrder: z.number().int().optional(),
});

const UpdateClauseReviewSchema = z.object({
  applicability: z.enum(applicabilityValues).optional(),
  naReason: z.string().optional(),
  observations: z.string().optional(),
  photoIds: z.array(z.string()).optional(),
  docIds: z.array(z.string()).optional(),
  docsRequired: z.string().optional(),
  remedialWorks: z.string().optional(),
  sortOrder: z.number().int().optional(),
});

const BulkCreateSchema = z.object({
  reviews: z.array(CreateClauseReviewSchema),
});

const InitializeSchema = z.object({
  clauseIds: z.array(z.string().uuid()),
});

// POST /api/site-inspections/:inspectionId/clause-reviews - Create review
clauseReviewsRouter.post(
  '/site-inspections/:inspectionId/clause-reviews',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const inspectionId = req.params.inspectionId as string;
      const parsed = CreateClauseReviewSchema.safeParse(req.body);

      if (!parsed.success) {
        res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.flatten().fieldErrors,
        });
        return;
      }

      const review = await service.create({
        ...parsed.data,
        inspectionId,
      });
      res.status(201).json(review);
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/site-inspections/:inspectionId/clause-reviews/bulk - Bulk create
clauseReviewsRouter.post(
  '/site-inspections/:inspectionId/clause-reviews/bulk',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const inspectionId = req.params.inspectionId as string;
      const parsed = BulkCreateSchema.safeParse(req.body);

      if (!parsed.success) {
        res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.flatten().fieldErrors,
        });
        return;
      }

      const reviews = await service.bulkCreate(
        parsed.data.reviews.map((review) => ({
          ...review,
          inspectionId,
        }))
      );
      res.status(201).json(reviews);
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/site-inspections/:inspectionId/clause-reviews/init - Initialize with all clauses
clauseReviewsRouter.post(
  '/site-inspections/:inspectionId/clause-reviews/init',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const inspectionId = req.params.inspectionId as string;
      const parsed = InitializeSchema.safeParse(req.body);

      if (!parsed.success) {
        res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.flatten().fieldErrors,
        });
        return;
      }

      const reviews = await service.initializeForInspection(inspectionId, parsed.data.clauseIds);
      res.status(201).json(reviews);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/site-inspections/:inspectionId/clause-reviews - List reviews
clauseReviewsRouter.get(
  '/site-inspections/:inspectionId/clause-reviews',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const inspectionId = req.params.inspectionId as string;
      const { applicability, grouped } = req.query;

      if (grouped === 'true') {
        const groupedReviews = await service.getGroupedByCategory(inspectionId);
        res.json(groupedReviews);
        return;
      }

      const reviews = await service.findAll({
        inspectionId,
        applicability: applicability as typeof applicabilityValues[number] | undefined,
      });
      res.json(reviews);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/site-inspections/:inspectionId/clause-review-summary - Get summary
clauseReviewsRouter.get(
  '/site-inspections/:inspectionId/clause-review-summary',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const inspectionId = req.params.inspectionId as string;
      const summary = await service.getSummary(inspectionId);
      res.json(summary);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/clause-reviews/:id - Get review by ID
clauseReviewsRouter.get(
  '/clause-reviews/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const review = await service.findById(id);
      res.json(review);
    } catch (error) {
      if (error instanceof ClauseReviewNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }
);

// PUT /api/clause-reviews/:id - Update review
clauseReviewsRouter.put(
  '/clause-reviews/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const parsed = UpdateClauseReviewSchema.safeParse(req.body);

      if (!parsed.success) {
        res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.flatten().fieldErrors,
        });
        return;
      }

      const review = await service.update(id, parsed.data);
      res.json(review);
    } catch (error) {
      if (error instanceof ClauseReviewNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }
);

// POST /api/clause-reviews/:id/mark-na - Mark as N/A with reason
clauseReviewsRouter.post(
  '/clause-reviews/:id/mark-na',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const { naReason } = req.body;

      if (!naReason || typeof naReason !== 'string') {
        res.status(400).json({ error: 'naReason is required' });
        return;
      }

      const review = await service.markAsNA(id, naReason);
      res.json(review);
    } catch (error) {
      if (error instanceof ClauseReviewNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }
);

// POST /api/clause-reviews/:id/mark-applicable - Mark as applicable
clauseReviewsRouter.post(
  '/clause-reviews/:id/mark-applicable',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const review = await service.markAsApplicable(id);
      res.json(review);
    } catch (error) {
      if (error instanceof ClauseReviewNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }
);

// DELETE /api/clause-reviews/:id - Delete review
clauseReviewsRouter.delete(
  '/clause-reviews/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      await service.delete(id);
      res.status(204).send();
    } catch (error) {
      if (error instanceof ClauseReviewNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }
);
