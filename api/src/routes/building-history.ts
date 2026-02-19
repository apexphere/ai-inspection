import { Router, type Request, type Response, type NextFunction, type Router as RouterType } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { PrismaBuildingHistoryRepository } from '../repositories/prisma/building-history.js';
import { BuildingHistoryService, BuildingHistoryNotFoundError } from '../services/building-history.js';

const prisma = new PrismaClient();
const repository = new PrismaBuildingHistoryRepository(prisma);
const service = new BuildingHistoryService(repository);

export const buildingHistoryRouter: RouterType = Router();

// Enums for validation
const BuildingHistoryTypeEnum = z.enum([
  'BUILDING_PERMIT', 'BUILDING_CONSENT', 'CCC', 'COA', 'RESOURCE_CONSENT', 'OTHER'
]);
const BuildingHistoryStatusEnum = z.enum([
  'ISSUED', 'LAPSED', 'CANCELLED', 'COMPLETE', 'UNKNOWN'
]);

// Validation schemas
const CreateHistorySchema = z.object({
  type: BuildingHistoryTypeEnum,
  reference: z.string().min(1),
  year: z.number().int().min(1800).max(2100),
  status: BuildingHistoryStatusEnum.optional(),
  description: z.string().optional(),
  issuer: z.string().optional(),
  issuedAt: z.string().datetime().optional(),
});

const UpdateHistorySchema = z.object({
  type: BuildingHistoryTypeEnum.optional(),
  reference: z.string().min(1).optional(),
  year: z.number().int().min(1800).max(2100).optional(),
  status: BuildingHistoryStatusEnum.optional(),
  description: z.string().nullable().optional(),
  issuer: z.string().nullable().optional(),
  issuedAt: z.string().datetime().nullable().optional(),
  sortOrder: z.number().int().optional(),
});

// POST /api/properties/:propertyId/history - Create history record
buildingHistoryRouter.post(
  '/properties/:propertyId/history',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const propertyId = req.params.propertyId as string;
      const parsed = CreateHistorySchema.safeParse(req.body);

      if (!parsed.success) {
        res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.flatten().fieldErrors,
        });
        return;
      }

      const history = await service.create({
        propertyId,
        ...parsed.data,
        issuedAt: parsed.data.issuedAt ? new Date(parsed.data.issuedAt) : undefined,
      });

      res.status(201).json(history);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/properties/:propertyId/history - List history for property
buildingHistoryRouter.get(
  '/properties/:propertyId/history',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const propertyId = req.params.propertyId as string;
      const history = await service.findByPropertyId(propertyId);
      res.json(history);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/building-history/:id - Get single history record
buildingHistoryRouter.get(
  '/building-history/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const history = await service.findById(id);
      res.json(history);
    } catch (error) {
      if (error instanceof BuildingHistoryNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }
);

// PUT /api/building-history/:id - Update history record
buildingHistoryRouter.put(
  '/building-history/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const parsed = UpdateHistorySchema.safeParse(req.body);

      if (!parsed.success) {
        res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.flatten().fieldErrors,
        });
        return;
      }

      const updateData = {
        ...parsed.data,
        description: parsed.data.description === null ? undefined : parsed.data.description,
        issuer: parsed.data.issuer === null ? undefined : parsed.data.issuer,
        issuedAt: parsed.data.issuedAt === null 
          ? null 
          : parsed.data.issuedAt 
            ? new Date(parsed.data.issuedAt) 
            : undefined,
      };

      const history = await service.update(id, updateData);
      res.json(history);
    } catch (error) {
      if (error instanceof BuildingHistoryNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }
);

// DELETE /api/building-history/:id - Delete history record
buildingHistoryRouter.delete(
  '/building-history/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      await service.delete(id);
      res.status(204).send();
    } catch (error) {
      if (error instanceof BuildingHistoryNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }
);
