import { Router, type Request, type Response, type NextFunction, type Router as RouterType } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { PrismaBuildingCodeClauseRepository } from '../repositories/prisma/building-code.js';
import { BuildingCodeClauseService, BuildingCodeClauseNotFoundError } from '../services/building-code.js';
import { requireAdmin } from '../middleware/auth.js';

const prisma = new PrismaClient();
const repository = new PrismaBuildingCodeClauseRepository(prisma);
const service = new BuildingCodeClauseService(repository);

export const buildingCodeRouter: RouterType = Router();

// Enums
const clauseCategories = ['B', 'C', 'D', 'E', 'F', 'G', 'H'] as const;
const durabilityPeriods = ['FIFTY_YEARS', 'FIFTEEN_YEARS', 'FIVE_YEARS', 'NA'] as const;

// Validation schemas
const CreateClauseSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  title: z.string().min(1, 'Title is required'),
  category: z.enum(clauseCategories),
  objective: z.string().optional(),
  functionalReq: z.string().optional(),
  performanceText: z.string().min(1, 'Performance text is required'),
  durabilityPeriod: z.enum(durabilityPeriods).optional(),
  typicalEvidence: z.array(z.string()).optional(),
  sortOrder: z.number().int().optional(),
  parentId: z.string().uuid().optional(),
});

const UpdateClauseSchema = z.object({
  code: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  category: z.enum(clauseCategories).optional(),
  objective: z.string().optional(),
  functionalReq: z.string().optional(),
  performanceText: z.string().min(1).optional(),
  durabilityPeriod: z.enum(durabilityPeriods).optional(),
  typicalEvidence: z.array(z.string()).optional(),
  sortOrder: z.number().int().optional(),
  parentId: z.string().uuid().nullable().optional(),
});

// GET /api/building-code/clauses - List all clauses with filters
buildingCodeRouter.get('/clauses', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, keyword, parentId, topLevel } = req.query;

    if (topLevel === 'true') {
      const clauses = await service.findTopLevel();
      res.json(clauses);
      return;
    }

    const clauses = await service.findAll({
      category: category as typeof clauseCategories[number] | undefined,
      keyword: keyword as string | undefined,
      parentId: parentId === 'null' ? null : parentId as string | undefined,
    });
    res.json(clauses);
  } catch (error) {
    next(error);
  }
});

// GET /api/building-code/clauses/hierarchy - Get clauses grouped by category
buildingCodeRouter.get('/clauses/hierarchy', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const hierarchy = await service.getHierarchy();
    res.json(hierarchy);
  } catch (error) {
    next(error);
  }
});

// GET /api/building-code/clauses/:code - Get clause by code
buildingCodeRouter.get('/clauses/:code', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const code = req.params.code as string;
    
    // Check if it's a UUID (id) or a code
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(code);
    
    let clause;
    if (isUuid) {
      clause = await service.findById(code);
    } else {
      clause = await service.findByCode(code);
    }
    
    res.json(clause);
  } catch (error) {
    if (error instanceof BuildingCodeClauseNotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    next(error);
  }
});

// GET /api/building-code/clauses/:id/children - Get children of a clause
buildingCodeRouter.get('/clauses/:id/children', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const children = await service.findChildren(id);
    res.json(children);
  } catch (error) {
    next(error);
  }
});

// POST /api/building-code/clauses - Create clause (admin)
buildingCodeRouter.post('/clauses', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = CreateClauseSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const clause = await service.create(parsed.data);
    res.status(201).json(clause);
  } catch (error) {
    next(error);
  }
});

// POST /api/building-code/clauses/bulk - Bulk create (admin/seed)
buildingCodeRouter.post('/clauses/bulk', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const clauses = z.array(CreateClauseSchema).max(100, 'Maximum 100 items per bulk request').safeParse(req.body);

    if (!clauses.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: clauses.error.flatten().fieldErrors,
      });
      return;
    }

    const created = await service.bulkCreate(clauses.data);
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
});

// PUT /api/building-code/clauses/:id - Update clause (admin)
buildingCodeRouter.put('/clauses/:id', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const parsed = UpdateClauseSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const clause = await service.update(id, {
      ...parsed.data,
      parentId: parsed.data.parentId === null ? undefined : parsed.data.parentId,
    });
    res.json(clause);
  } catch (error) {
    if (error instanceof BuildingCodeClauseNotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    next(error);
  }
});

// DELETE /api/building-code/clauses/:id - Delete clause (admin)
buildingCodeRouter.delete('/clauses/:id', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    await service.delete(id);
    res.status(204).send();
  } catch (error) {
    if (error instanceof BuildingCodeClauseNotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    next(error);
  }
});
