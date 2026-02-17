import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { PrismaClient, type Prisma } from '@prisma/client';
import { PrismaInspectionRepository } from '../repositories/prisma/inspection.js';
import { InspectionService, InspectionNotFoundError } from '../services/inspection.js';

const prisma = new PrismaClient();
const repository = new PrismaInspectionRepository(prisma);
const service = new InspectionService(repository);

export const inspectionsRouter = Router();

// Validation schemas
const CreateInspectionSchema = z.object({
  address: z.string().min(1, 'Address is required'),
  clientName: z.string().min(1, 'Client name is required'),
  inspectorName: z.string().optional(),
  checklistId: z.string().min(1, 'Checklist ID is required'),
  currentSection: z.string().default('exterior'),
  metadata: z.any().optional(),
});

const UpdateInspectionSchema = z.object({
  address: z.string().min(1).optional(),
  clientName: z.string().min(1).optional(),
  inspectorName: z.string().optional(),
  status: z.enum(['STARTED', 'IN_PROGRESS', 'COMPLETED']).optional(),
  currentSection: z.string().optional(),
  metadata: z.any().optional(),
  completedAt: z.string().datetime().optional(),
});

// POST /api/inspections - Create inspection
inspectionsRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = CreateInspectionSchema.safeParse(req.body);
    
    if (!parsed.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const inspection = await service.create({
      ...parsed.data,
      metadata: parsed.data.metadata as Prisma.InputJsonValue | undefined,
    });
    res.status(201).json(inspection);
  } catch (error) {
    next(error);
  }
});

// GET /api/inspections - List all inspections
inspectionsRouter.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const inspections = await service.findAll();
    res.json(inspections);
  } catch (error) {
    next(error);
  }
});

// GET /api/inspections/:id - Get inspection by ID
inspectionsRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const inspection = await service.findById(id);
    res.json(inspection);
  } catch (error) {
    if (error instanceof InspectionNotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    next(error);
  }
});

// PUT /api/inspections/:id - Update inspection
inspectionsRouter.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const parsed = UpdateInspectionSchema.safeParse(req.body);
    
    if (!parsed.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    // Convert completedAt string to Date if provided
    const updateData = {
      ...parsed.data,
      metadata: parsed.data.metadata as Prisma.InputJsonValue | undefined,
      completedAt: parsed.data.completedAt ? new Date(parsed.data.completedAt) : undefined,
    };
    
    const inspection = await service.update(id, updateData);
    res.json(inspection);
  } catch (error) {
    if (error instanceof InspectionNotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    next(error);
  }
});

// DELETE /api/inspections/:id - Delete inspection
inspectionsRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    await service.delete(id);
    res.status(204).send();
  } catch (error) {
    if (error instanceof InspectionNotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    next(error);
  }
});
