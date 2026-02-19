import { Router, type Request, type Response, type NextFunction, type Router as RouterType } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { PrismaSiteMeasurementRepository } from '../repositories/prisma/site-measurement.js';
import { SiteMeasurementService, SiteMeasurementNotFoundError } from '../services/site-measurement.js';

const prisma = new PrismaClient();
const repository = new PrismaSiteMeasurementRepository(prisma);
const service = new SiteMeasurementService(repository);

export const siteMeasurementsRouter: RouterType = Router();

// Enums for validation
const MeasurementTypeEnum = z.enum([
  'MOISTURE_CONTENT', 'SLOPE_FALL', 'DIMENSION', 'CLEARANCE', 'TEMPERATURE', 'OTHER'
]);
const MeasurementUnitEnum = z.enum([
  'PERCENT', 'MM_PER_M', 'MM', 'CM', 'M', 'CELSIUS'
]);
const MeasurementResultEnum = z.enum(['PENDING', 'PASS', 'FAIL']);

// Validation schemas
const CreateMeasurementSchema = z.object({
  type: MeasurementTypeEnum,
  location: z.string().min(1),
  value: z.number(),
  unit: MeasurementUnitEnum,
  linkedClauseId: z.string().uuid().optional(),
  notes: z.string().optional(),
});

const UpdateMeasurementSchema = z.object({
  type: MeasurementTypeEnum.optional(),
  location: z.string().min(1).optional(),
  value: z.number().optional(),
  unit: MeasurementUnitEnum.optional(),
  result: MeasurementResultEnum.optional(),
  linkedClauseId: z.string().uuid().nullable().optional(),
  notes: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
});

// POST /api/site-inspections/:inspectionId/measurements - Create measurement
siteMeasurementsRouter.post(
  '/site-inspections/:inspectionId/measurements',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const inspectionId = req.params.inspectionId as string;
      const parsed = CreateMeasurementSchema.safeParse(req.body);

      if (!parsed.success) {
        res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.flatten().fieldErrors,
        });
        return;
      }

      const measurement = await service.create({
        inspectionId,
        ...parsed.data,
      });

      res.status(201).json(measurement);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/site-inspections/:inspectionId/measurements - List measurements
siteMeasurementsRouter.get(
  '/site-inspections/:inspectionId/measurements',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const inspectionId = req.params.inspectionId as string;
      const measurements = await service.findByInspectionId(inspectionId);
      res.json(measurements);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/measurements/:id - Get single measurement
siteMeasurementsRouter.get(
  '/measurements/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const measurement = await service.findById(id);
      res.json(measurement);
    } catch (error) {
      if (error instanceof SiteMeasurementNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }
);

// PUT /api/measurements/:id - Update measurement
siteMeasurementsRouter.put(
  '/measurements/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const parsed = UpdateMeasurementSchema.safeParse(req.body);

      if (!parsed.success) {
        res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.flatten().fieldErrors,
        });
        return;
      }

      const updateData = {
        ...parsed.data,
        linkedClauseId: parsed.data.linkedClauseId === null ? undefined : parsed.data.linkedClauseId,
        notes: parsed.data.notes === null ? undefined : parsed.data.notes,
      };

      const measurement = await service.update(id, updateData);
      res.json(measurement);
    } catch (error) {
      if (error instanceof SiteMeasurementNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }
);

// DELETE /api/measurements/:id - Delete measurement
siteMeasurementsRouter.delete(
  '/measurements/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      await service.delete(id);
      res.status(204).send();
    } catch (error) {
      if (error instanceof SiteMeasurementNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }
);

// GET /api/measurements/acceptable-ranges - Get acceptable ranges for all types
siteMeasurementsRouter.get(
  '/measurements/acceptable-ranges',
  (_req: Request, res: Response) => {
    const ranges = {
      MOISTURE_CONTENT: { max: 18, unit: 'PERCENT', description: '< 18%' },
      SLOPE_FALL: { min: 10, unit: 'MM_PER_M', description: '≥ 1:100 (10mm/m)' },
      DIMENSION: null,
      CLEARANCE: null,
      TEMPERATURE: null,
      OTHER: null,
    };
    res.json(ranges);
  }
);
