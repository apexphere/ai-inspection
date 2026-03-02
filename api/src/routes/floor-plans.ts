/**
 * Floor Plans routes
 * POST/GET /api/projects/:id/floor-plans
 * PUT/DELETE /api/projects/:id/floor-plans/:fid
 *
 * Floor plan is building metadata owned by the Project.
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

// GET /api/projects/:id/floor-plans
floorPlansRouter.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const floorPlans = await prisma.floorPlan.findMany({
      where: { projectId: req.params.id as string },
      orderBy: { floor: 'asc' },
    });
    res.json(floorPlans);
  } catch (err) {
    next(err);
  }
});

// POST /api/projects/:id/floor-plans
floorPlansRouter.post('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = CreateFloorPlanSchema.parse(req.body);

    const project = await prisma.project.findUnique({ where: { id: req.params.id as string } });
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const floorPlan = await prisma.floorPlan.create({
      data: {
        projectId: req.params.id as string,
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

// PUT /api/projects/:id/floor-plans/:fid
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

// DELETE /api/projects/:id/floor-plans/:fid
floorPlansRouter.delete('/:fid', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await prisma.floorPlan.delete({ where: { id: req.params.fid as string } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
