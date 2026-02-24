import { Router, type Request, type Response, type NextFunction, type Router as RouterType } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { PrismaCostEstimateRepository, PrismaCostLineItemRepository } from '../repositories/prisma/cost-estimate.js';
import {
  CostEstimateService,
  CostEstimateNotFoundError,
  CostEstimateAlreadyExistsError,
  CostLineItemNotFoundError,
} from '../services/cost-estimate.js';

const prisma = new PrismaClient();
const estimateRepo = new PrismaCostEstimateRepository(prisma);
const lineItemRepo = new PrismaCostLineItemRepository(prisma);
const service = new CostEstimateService(estimateRepo, lineItemRepo);

export const costEstimatesRouter: RouterType = Router();

const CreateCostEstimateSchema = z.object({
  contingencyRate: z.number().min(0).max(1).optional(),
  notes: z.string().optional(),
});

const UpdateCostEstimateSchema = z.object({
  contingencyRate: z.number().min(0).max(1).optional(),
  notes: z.string().nullable().optional(),
});

const CreateCostLineItemSchema = z.object({
  category: z.string().min(1),
  description: z.string().min(1),
  quantity: z.number().positive(),
  unit: z.string().min(1),
  rate: z.number().min(0),
  sortOrder: z.number().int().optional(),
});

const UpdateCostLineItemSchema = z.object({
  category: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  quantity: z.number().positive().optional(),
  unit: z.string().min(1).optional(),
  rate: z.number().min(0).optional(),
  sortOrder: z.number().int().optional(),
});

// POST /api/reports/:reportId/cost-estimate
costEstimatesRouter.post(
  '/reports/:reportId/cost-estimate',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const reportId = req.params.reportId as string;
      const parsed = CreateCostEstimateSchema.safeParse(req.body);

      if (!parsed.success) {
        res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.flatten().fieldErrors,
        });
        return;
      }

      const estimate = await service.create({
        reportId,
        ...parsed.data,
      });

      res.status(201).json(estimate);
    } catch (error) {
      if (error instanceof CostEstimateAlreadyExistsError) {
        res.status(409).json({ error: error.message });
        return;
      }
      next(error);
    }
  }
);

// GET /api/reports/:reportId/cost-estimate
costEstimatesRouter.get(
  '/reports/:reportId/cost-estimate',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const reportId = req.params.reportId as string;
      const estimate = await service.findByReportId(reportId);
      res.json(estimate);
    } catch (error) {
      if (error instanceof CostEstimateNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }
);

// PUT /api/cost-estimates/:id
costEstimatesRouter.put(
  '/cost-estimates/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const parsed = UpdateCostEstimateSchema.safeParse(req.body);

      if (!parsed.success) {
        res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.flatten().fieldErrors,
        });
        return;
      }

      const estimate = await service.update(id, parsed.data);
      res.json(estimate);
    } catch (error) {
      if (error instanceof CostEstimateNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }
);

// DELETE /api/cost-estimates/:id
costEstimatesRouter.delete(
  '/cost-estimates/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      await service.delete(id);
      res.status(204).send();
    } catch (error) {
      if (error instanceof CostEstimateNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }
);

// POST /api/cost-estimates/:id/line-items
costEstimatesRouter.post(
  '/cost-estimates/:id/line-items',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const costEstimateId = req.params.id as string;
      const parsed = CreateCostLineItemSchema.safeParse(req.body);

      if (!parsed.success) {
        res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.flatten().fieldErrors,
        });
        return;
      }

      const lineItem = await service.addLineItem({
        costEstimateId,
        ...parsed.data,
      });

      res.status(201).json(lineItem);
    } catch (error) {
      if (error instanceof CostEstimateNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }
);

// PUT /api/cost-line-items/:id
costEstimatesRouter.put(
  '/cost-line-items/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const parsed = UpdateCostLineItemSchema.safeParse(req.body);

      if (!parsed.success) {
        res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.flatten().fieldErrors,
        });
        return;
      }

      const lineItem = await service.updateLineItem(id, parsed.data);
      res.json(lineItem);
    } catch (error) {
      if (error instanceof CostLineItemNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }
);

// DELETE /api/cost-line-items/:id
costEstimatesRouter.delete(
  '/cost-line-items/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      await service.deleteLineItem(id);
      res.status(204).send();
    } catch (error) {
      if (error instanceof CostLineItemNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }
);
