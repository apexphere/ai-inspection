import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { PrismaInspectionRepository } from '../repositories/prisma/inspection.js';
import {
  NavigationService,
  InspectionNotFoundError,
  InvalidSectionError,
} from '../services/navigation.js';

const prisma = new PrismaClient();
const repository = new PrismaInspectionRepository(prisma);
const service = new NavigationService(repository);

export const navigationRouter = Router();

// Validation schema
const NavigateSchema = z.object({
  section: z.string().min(1, 'Section is required'),
});

// POST /api/inspections/:inspectionId/navigate - Navigate to section
navigationRouter.post(
  '/inspections/:inspectionId/navigate',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const inspectionId = req.params.inspectionId as string;
      const parsed = NavigateSchema.safeParse(req.body);

      if (!parsed.success) {
        res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.flatten().fieldErrors,
        });
        return;
      }

      const result = await service.navigate(inspectionId, parsed.data.section);
      res.json(result);
    } catch (error) {
      if (error instanceof InspectionNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      if (error instanceof InvalidSectionError) {
        res.status(400).json({ error: error.message });
        return;
      }
      next(error);
    }
  }
);

// GET /api/inspections/:inspectionId/status - Get inspection status
navigationRouter.get(
  '/inspections/:inspectionId/status',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const inspectionId = req.params.inspectionId as string;
      const status = await service.getStatus(inspectionId);
      res.json(status);
    } catch (error) {
      if (error instanceof InspectionNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }
);

// GET /api/inspections/:inspectionId/suggest - Get next suggestion
navigationRouter.get(
  '/inspections/:inspectionId/suggest',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const inspectionId = req.params.inspectionId as string;
      const suggestion = await service.suggest(inspectionId);
      res.json(suggestion);
    } catch (error) {
      if (error instanceof InspectionNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }
);
