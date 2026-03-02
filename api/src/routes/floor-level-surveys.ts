/**
 * Floor Level Survey routes — Appendix C
 * POST/GET /api/site-inspections/:id/floor-level-surveys
 * PUT/DELETE /api/site-inspections/:id/floor-level-surveys/:sid
 */

import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export const floorLevelSurveysRouter = Router({ mergeParams: true });

const CreateFloorLevelSurveySchema = z.object({
  area: z.string().min(1),
  maxDeviation: z.number().optional(),
  withinTolerance: z.boolean().optional(),
  notes: z.string().optional(),
  photoIds: z.array(z.string()).optional(),
});

// GET
floorLevelSurveysRouter.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const surveys = await prisma.floorLevelSurvey.findMany({
      where: { inspectionId: req.params.id as string },
      orderBy: { createdAt: 'asc' },
    });
    res.json(surveys);
  } catch (err) { next(err); }
});

// POST
floorLevelSurveysRouter.post('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = CreateFloorLevelSurveySchema.parse(req.body);
    const inspection = await prisma.siteInspection.findUnique({ where: { id: req.params.id as string } });
    if (!inspection) { res.status(404).json({ error: 'Inspection not found' }); return; }

    const survey = await prisma.floorLevelSurvey.create({
      data: { inspectionId: req.params.id as string, ...data, photoIds: data.photoIds ?? [] },
    });
    res.status(201).json(survey);
  } catch (err) { next(err); }
});

// PUT
floorLevelSurveysRouter.put('/:sid', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = CreateFloorLevelSurveySchema.partial().parse(req.body);
    const survey = await prisma.floorLevelSurvey.update({ where: { id: req.params.sid as string }, data });
    res.json(survey);
  } catch (err) { next(err); }
});

// DELETE
floorLevelSurveysRouter.delete('/:sid', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await prisma.floorLevelSurvey.delete({ where: { id: req.params.sid as string } });
    res.status(204).send();
  } catch (err) { next(err); }
});
