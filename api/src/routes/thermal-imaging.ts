/**
 * Thermal Imaging routes — Appendix D
 * POST/GET /api/site-inspections/:id/thermal-imaging
 * PUT/DELETE /api/site-inspections/:id/thermal-imaging/:tid
 */

import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export const thermalImagingRouter = Router({ mergeParams: true });

const CreateThermalImagingSchema = z.object({
  room: z.string().min(1),
  floor: z.number().int().min(1).optional(),
  anomalyFound: z.boolean().default(false),
  notes: z.string().optional(),
  photoIds: z.array(z.string()).optional(),
});

// GET
thermalImagingRouter.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const records = await prisma.thermalImagingRecord.findMany({
      where: { inspectionId: req.params.id as string },
      orderBy: [{ floor: 'asc' }, { createdAt: 'asc' }],
    });
    res.json(records);
  } catch (err) { next(err); }
});

// POST
thermalImagingRouter.post('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = CreateThermalImagingSchema.parse(req.body);
    const inspection = await prisma.siteInspection.findUnique({ where: { id: req.params.id as string } });
    if (!inspection) { res.status(404).json({ error: 'Inspection not found' }); return; }

    const record = await prisma.thermalImagingRecord.create({
      data: { inspectionId: req.params.id as string, ...data, photoIds: data.photoIds ?? [] },
    });
    res.status(201).json(record);
  } catch (err) { next(err); }
});

// PUT
thermalImagingRouter.put('/:tid', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = CreateThermalImagingSchema.partial().parse(req.body);
    const record = await prisma.thermalImagingRecord.update({ where: { id: req.params.tid as string }, data });
    res.json(record);
  } catch (err) { next(err); }
});

// DELETE
thermalImagingRouter.delete('/:tid', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await prisma.thermalImagingRecord.delete({ where: { id: req.params.tid as string } });
    res.status(204).send();
  } catch (err) { next(err); }
});
