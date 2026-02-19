import { Router, type Request, type Response, type NextFunction, type Router as RouterType } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { PrismaProjectRepository } from '../repositories/prisma/project.js';
import { ProjectService, ProjectNotFoundError } from '../services/project.js';

const prisma = new PrismaClient();
const repository = new PrismaProjectRepository(prisma);
const service = new ProjectService(repository);

export const projectsRouter: RouterType = Router();

// Validation schemas
const CreateProjectSchema = z.object({
  jobNumber: z.string().min(1).optional(),
  activity: z.string().min(1, 'Activity is required'),
  reportType: z.enum(['COA', 'CCC_GAP', 'PPI', 'SAFE_SANITARY', 'TFA']),
  propertyId: z.string().uuid('Invalid property ID'),
  clientId: z.string().uuid('Invalid client ID'),
});

const UpdateProjectSchema = z.object({
  jobNumber: z.string().min(1).optional(),
  activity: z.string().min(1).optional(),
  reportType: z.enum(['COA', 'CCC_GAP', 'PPI', 'SAFE_SANITARY', 'TFA']).optional(),
  status: z.enum(['DRAFT', 'IN_PROGRESS', 'REVIEW', 'COMPLETED']).optional(),
  propertyId: z.string().uuid().optional(),
  clientId: z.string().uuid().optional(),
});

// POST /api/projects - Create project
projectsRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = CreateProjectSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const project = await service.create(parsed.data);
    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
});

// GET /api/projects - List projects with optional filters
projectsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { jobNumber, address, clientName, status, reportType } = req.query;

    const projects = await service.findAll({
      jobNumber: jobNumber as string | undefined,
      address: address as string | undefined,
      clientName: clientName as string | undefined,
      status: status as 'DRAFT' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED' | undefined,
      reportType: reportType as 'COA' | 'CCC_GAP' | 'PPI' | 'SAFE_SANITARY' | 'TFA' | undefined,
    });
    res.json(projects);
  } catch (error) {
    next(error);
  }
});

// GET /api/projects/:id - Get project by ID
projectsRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const project = await service.findById(id);
    res.json(project);
  } catch (error) {
    if (error instanceof ProjectNotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    next(error);
  }
});

// PUT /api/projects/:id - Update project
projectsRouter.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const parsed = UpdateProjectSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const project = await service.update(id, parsed.data);
    res.json(project);
  } catch (error) {
    if (error instanceof ProjectNotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    next(error);
  }
});

// DELETE /api/projects/:id - Delete project
projectsRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    await service.delete(id);
    res.status(204).send();
  } catch (error) {
    if (error instanceof ProjectNotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    next(error);
  }
});
