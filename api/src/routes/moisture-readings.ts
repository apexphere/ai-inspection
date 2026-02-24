import { Router, type Request, type Response, type NextFunction, type Router as RouterType } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { PrismaMoistureReadingRepository } from '../repositories/prisma/moisture-reading.js';
import { MoistureReadingService, MoistureReadingNotFoundError } from '../services/moisture-reading.js';

const prisma = new PrismaClient();
const repository = new PrismaMoistureReadingRepository(prisma);
const service = new MoistureReadingService(repository);

export const moistureReadingsRouter: RouterType = Router();

const MoistureResultEnum = z.enum(['PENDING', 'ACCEPTABLE', 'MARGINAL', 'UNACCEPTABLE']);

const CreateMoistureReadingSchema = z.object({
  location: z.string().min(1),
  substrate: z.string().optional(),
  reading: z.number().min(0).max(100),
  depth: z.number().positive().optional(),
  result: MoistureResultEnum.optional(),
  defectId: z.string().uuid().optional(),
  linkedClauseId: z.string().uuid().optional(),
  notes: z.string().optional(),
  takenAt: z.string().datetime().optional(),
  sortOrder: z.number().int().optional(),
});

const UpdateMoistureReadingSchema = z.object({
  location: z.string().min(1).optional(),
  substrate: z.string().nullable().optional(),
  reading: z.number().min(0).max(100).optional(),
  depth: z.number().positive().nullable().optional(),
  result: MoistureResultEnum.optional(),
  defectId: z.string().uuid().nullable().optional(),
  linkedClauseId: z.string().uuid().nullable().optional(),
  notes: z.string().nullable().optional(),
  takenAt: z.string().datetime().nullable().optional(),
  sortOrder: z.number().int().optional(),
});

// POST /api/inspections/:inspectionId/moisture-readings
moistureReadingsRouter.post(
  '/inspections/:inspectionId/moisture-readings',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const inspectionId = req.params.inspectionId as string;
      const parsed = CreateMoistureReadingSchema.safeParse(req.body);

      if (!parsed.success) {
        res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.flatten().fieldErrors,
        });
        return;
      }

      const reading = await service.create({
        inspectionId,
        ...parsed.data,
        takenAt: parsed.data.takenAt ? new Date(parsed.data.takenAt) : undefined,
      });

      res.status(201).json(reading);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/inspections/:inspectionId/moisture-readings
moistureReadingsRouter.get(
  '/inspections/:inspectionId/moisture-readings',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const inspectionId = req.params.inspectionId as string;
      const readings = await service.findByInspectionId(inspectionId);
      res.json(readings);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/moisture-readings/:id
moistureReadingsRouter.get(
  '/moisture-readings/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const reading = await service.findById(id);
      res.json(reading);
    } catch (error) {
      if (error instanceof MoistureReadingNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }
);

// PUT /api/moisture-readings/:id
moistureReadingsRouter.put(
  '/moisture-readings/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const parsed = UpdateMoistureReadingSchema.safeParse(req.body);

      if (!parsed.success) {
        res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.flatten().fieldErrors,
        });
        return;
      }

      const reading = await service.update(id, {
        ...parsed.data,
        takenAt: parsed.data.takenAt === null
          ? null
          : parsed.data.takenAt
            ? new Date(parsed.data.takenAt)
            : undefined,
      });

      res.json(reading);
    } catch (error) {
      if (error instanceof MoistureReadingNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }
);

// DELETE /api/moisture-readings/:id
moistureReadingsRouter.delete(
  '/moisture-readings/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      await service.delete(id);
      res.status(204).send();
    } catch (error) {
      if (error instanceof MoistureReadingNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }
);
