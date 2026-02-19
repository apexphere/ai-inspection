import { Router, type Request, type Response, type NextFunction, type Router as RouterType } from 'express';
import { z } from 'zod';
import { PrismaClient, type Severity } from '@prisma/client';
import { PrismaInspectionRepository } from '../repositories/prisma/inspection.js';
import { FindingService, FindingNotFoundError, InspectionNotFoundError } from '../services/finding.js';

const prisma = new PrismaClient();
const repository = new PrismaInspectionRepository(prisma);
const service = new FindingService(repository);

export const findingsRouter: RouterType = Router();

// Validation schemas
const CreateFindingSchema = z.object({
  section: z.string().min(1, 'Section is required'),
  text: z.string().min(1, 'Text is required'),
  severity: z.enum(['INFO', 'MINOR', 'MAJOR', 'URGENT']).optional(),
  matchedComment: z.string().optional(),
});

const UpdateFindingSchema = z.object({
  text: z.string().min(1).optional(),
  severity: z.enum(['INFO', 'MINOR', 'MAJOR', 'URGENT']).optional(),
  matchedComment: z.string().optional(),
});

// POST /api/inspections/:inspectionId/findings - Add finding to inspection
findingsRouter.post(
  '/inspections/:inspectionId/findings',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const inspectionId = req.params.inspectionId as string;
      const parsed = CreateFindingSchema.safeParse(req.body);

      if (!parsed.success) {
        res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.flatten().fieldErrors,
        });
        return;
      }

      const finding = await service.create({
        inspectionId,
        section: parsed.data.section,
        text: parsed.data.text,
        severity: parsed.data.severity as Severity | undefined,
        matchedComment: parsed.data.matchedComment,
      });

      res.status(201).json(finding);
    } catch (error) {
      if (error instanceof InspectionNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }
);

// GET /api/inspections/:inspectionId/findings - List findings for inspection
findingsRouter.get(
  '/inspections/:inspectionId/findings',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const inspectionId = req.params.inspectionId as string;
      const findings = await service.findByInspection(inspectionId);
      res.json(findings);
    } catch (error) {
      if (error instanceof InspectionNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }
);

// PUT /api/findings/:id - Update finding
findingsRouter.put('/findings/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const parsed = UpdateFindingSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const finding = await service.update(id, {
      text: parsed.data.text,
      severity: parsed.data.severity as Severity | undefined,
      matchedComment: parsed.data.matchedComment,
    });

    res.json(finding);
  } catch (error) {
    if (error instanceof FindingNotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    next(error);
  }
});

// DELETE /api/findings/:id - Delete finding
findingsRouter.delete('/findings/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    await service.delete(id);
    res.status(204).send();
  } catch (error) {
    if (error instanceof FindingNotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    next(error);
  }
});
