/**
 * Floor Plans routes
 * POST/GET /api/site-inspections/:id/floor-plans
 * PUT/DELETE /api/site-inspections/:id/floor-plans/:fid
 *
 * Floor plan is the spatial anchor for the entire PPI inspection.
 * Each floor has a canonical room list that interior findings reference.
 */

import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export const floorPlansRouter = Router({ mergeParams: true });

const CreateFloorPlanSchema = z.object({
  floor: z.number().int().min(1, 'Floor must be 1 or greater'),
  label: z.string().optional(),
  rooms: z.array(z.string().min(1)).min(1, 'At least one room required'),
  photoIds: z.array(z.string()).optional(),
});

const UpdateFloorPlanSchema = CreateFloorPlanSchema.partial().omit({ floor: true });

// GET /api/site-inspections/:id/floor-plans
floorPlansRouter.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const floorPlans = await prisma.floorPlan.findMany({
      where: { inspectionId: req.params.id as string },
      orderBy: { floor: 'asc' },
    });
    res.json(floorPlans);
  } catch (err) {
    next(err);
  }
});

// POST /api/site-inspections/:id/floor-plans
floorPlansRouter.post('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = CreateFloorPlanSchema.parse(req.body);

    // Verify inspection exists
    const inspection = await prisma.siteInspection.findUnique({ where: { id: req.params.id as string } });
    if (!inspection) {
      res.status(404).json({ error: 'Inspection not found' });
      return;
    }

    const floorPlan = await prisma.floorPlan.create({
      data: {
        inspectionId: req.params.id as string,
        floor: data.floor,
        label: data.label,
        rooms: data.rooms,
        photoIds: data.photoIds ?? [],
      },
    });
    res.status(201).json(floorPlan);
  } catch (err) {
    next(err);
  }
});

// PUT /api/site-inspections/:id/floor-plans/:fid
floorPlansRouter.put('/:fid', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = UpdateFloorPlanSchema.parse(req.body);
    const floorPlan = await prisma.floorPlan.update({
      where: { id: req.params.fid as string },
      data,
    });
    res.json(floorPlan);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/site-inspections/:id/floor-plans/:fid
floorPlansRouter.delete('/:fid', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await prisma.floorPlan.delete({ where: { id: req.params.fid as string } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
