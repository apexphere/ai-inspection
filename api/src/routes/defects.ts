/**
 * Defect Routes — Issue #218
 *
 * CRUD for defects linked to site inspections.
 */

import { Router, type Request, type Response, type NextFunction, type Router as RouterType } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { PrismaDefectRepository } from '../repositories/prisma/defect.js';
import { DefectService, DefectNotFoundError } from '../services/defect.js';

const prisma = new PrismaClient();
const repository = new PrismaDefectRepository(prisma);
const service = new DefectService(repository);

export const defectsRouter: RouterType = Router();

// Validation schemas
const BuildingElementValues = [
  'ROOF', 'WALL', 'WINDOW', 'DOOR', 'DECK', 'BALCONY',
  'CLADDING', 'FOUNDATION', 'FLOOR', 'CEILING', 'PLUMBING',
  'ELECTRICAL', 'INSULATION', 'DRAINAGE', 'STRUCTURE', 'OTHER',
] as const;

const DefectPriorityValues = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const;

const CreateDefectSchema = z.object({
  location: z.string().min(1, 'Location is required'),
  element: z.enum(BuildingElementValues),
  description: z.string().min(1, 'Description is required'),
  cause: z.string().optional(),
  remedialAction: z.string().optional(),
  priority: z.enum(DefectPriorityValues).default('MEDIUM'),
  linkedClauseId: z.string().uuid().optional(),
  photoIds: z.array(z.string().uuid()).default([]),
  sortOrder: z.number().int().default(0),
});

const UpdateDefectSchema = z.object({
  location: z.string().min(1).optional(),
  element: z.enum(BuildingElementValues).optional(),
  description: z.string().min(1).optional(),
  cause: z.string().nullable().optional(),
  remedialAction: z.string().nullable().optional(),
  priority: z.enum(DefectPriorityValues).optional(),
  linkedClauseId: z.string().uuid().nullable().optional(),
  photoIds: z.array(z.string().uuid()).optional(),
  sortOrder: z.number().int().optional(),
});

const UuidParam = z.object({
  id: z.string().uuid('Invalid ID format'),
});

const InspectionIdParam = z.object({
  inspectionId: z.string().uuid('Invalid inspection ID format'),
});

/**
 * POST /api/site-inspections/:inspectionId/defects
 * Create a defect for an inspection
 */
defectsRouter.post('/site-inspections/:inspectionId/defects', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const params = InspectionIdParam.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: 'Invalid inspection ID', details: params.error.flatten().fieldErrors });
      return;
    }

    const parsed = CreateDefectSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors });
      return;
    }

    const defect = await service.create({
      inspectionId: params.data.inspectionId,
      ...parsed.data,
    });

    res.status(201).json(defect);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/site-inspections/:inspectionId/defects
 * List defects for an inspection
 */
defectsRouter.get('/site-inspections/:inspectionId/defects', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const params = InspectionIdParam.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: 'Invalid inspection ID', details: params.error.flatten().fieldErrors });
      return;
    }

    const defects = await service.findByInspectionId(params.data.inspectionId);
    res.json(defects);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/defects/:id
 * Get a single defect by ID
 */
defectsRouter.get('/defects/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const params = UuidParam.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: 'Invalid ID format', details: params.error.flatten().fieldErrors });
      return;
    }

    const defect = await service.findById(params.data.id);
    res.json(defect);
  } catch (error) {
    if (error instanceof DefectNotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    next(error);
  }
});

/**
 * PUT /api/defects/:id
 * Update a defect
 */
defectsRouter.put('/defects/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const params = UuidParam.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: 'Invalid ID format', details: params.error.flatten().fieldErrors });
      return;
    }

    const parsed = UpdateDefectSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors });
      return;
    }

    const defect = await service.update(params.data.id, parsed.data);
    res.json(defect);
  } catch (error) {
    if (error instanceof DefectNotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    next(error);
  }
});

/**
 * DELETE /api/defects/:id
 * Delete a defect
 */
defectsRouter.delete('/defects/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const params = UuidParam.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: 'Invalid ID format', details: params.error.flatten().fieldErrors });
      return;
    }

    await service.delete(params.data.id);
    res.status(204).send();
  } catch (error) {
    if (error instanceof DefectNotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    next(error);
  }
});
