/**
 * Inspection Section Conclusions routes
 * POST/GET /api/site-inspections/:id/section-conclusions
 * PUT /api/site-inspections/:id/section-conclusions/:sid
 */

import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export const sectionConclusionsRouter = Router({ mergeParams: true });

const VALID_SECTIONS = ['SITE', 'EXTERIOR', 'INTERIOR', 'SERVICES'] as const;

const UpsertSectionConclusionSchema = z.object({
  section: z.enum(VALID_SECTIONS),
  conclusion: z.string().min(1, 'Conclusion text required'),
});

// GET /api/site-inspections/:id/section-conclusions
sectionConclusionsRouter.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const conclusions = await prisma.inspectionSectionConclusion.findMany({
      where: { inspectionId: req.params.id as string },
      orderBy: { section: 'asc' },
    });
    res.json(conclusions);
  } catch (err) {
    next(err);
  }
});

// POST /api/site-inspections/:id/section-conclusions (upsert by section)
sectionConclusionsRouter.post('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = UpsertSectionConclusionSchema.parse(req.body);

    const inspection = await prisma.siteInspection.findUnique({ where: { id: req.params.id as string } });
    if (!inspection) {
      res.status(404).json({ error: 'Inspection not found' });
      return;
    }

    const conclusion = await prisma.inspectionSectionConclusion.upsert({
      where: { inspectionId_section: { inspectionId: req.params.id as string, section: data.section } },
      create: { inspectionId: req.params.id as string, section: data.section, conclusion: data.conclusion },
      update: { conclusion: data.conclusion },
    });
    res.status(201).json(conclusion);
  } catch (err) {
    next(err);
  }
});
