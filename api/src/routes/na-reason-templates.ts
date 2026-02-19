import { Router, type Request, type Response, type NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { PrismaNAReasonTemplateRepository } from '../repositories/prisma/na-reason-template.js';
import { NAReasonTemplateService, NAReasonTemplateNotFoundError } from '../services/na-reason-template.js';

const prisma = new PrismaClient();
const repository = new PrismaNAReasonTemplateRepository(prisma);
const service = new NAReasonTemplateService(repository);

export const naReasonTemplatesRouter: Router = Router();

// GET /api/na-reason-templates - List all templates
naReasonTemplatesRouter.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const templates = await service.findAll();
    res.json(templates);
  } catch (error) {
    next(error);
  }
});

// GET /api/na-reason-templates/:id - Get template by ID
naReasonTemplatesRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const template = await service.findById(id);
    res.json(template);
  } catch (error) {
    if (error instanceof NAReasonTemplateNotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    next(error);
  }
});
