import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { PrismaChecklistItemRepository } from '../repositories/prisma/checklist-item.js';
import { ChecklistItemService, ChecklistItemNotFoundError } from '../services/checklist-item.js';

const prisma = new PrismaClient();
const repository = new PrismaChecklistItemRepository(prisma);
const service = new ChecklistItemService(repository);

export const checklistItemsRouter = Router();

// Enums
const checklistCategories = ['EXTERIOR', 'INTERIOR', 'DECKS', 'SERVICES', 'SITE'] as const;
const decisions = ['PASS', 'FAIL', 'NA'] as const;

// Validation schemas
const CreateChecklistItemSchema = z.object({
  category: z.enum(checklistCategories),
  item: z.string().min(1, 'Item text is required'),
  decision: z.enum(decisions),
  notes: z.string().optional(),
  photoIds: z.array(z.string()).optional(),
  sortOrder: z.number().int().optional(),
});

const UpdateChecklistItemSchema = z.object({
  category: z.enum(checklistCategories).optional(),
  item: z.string().min(1).optional(),
  decision: z.enum(decisions).optional(),
  notes: z.string().optional(),
  photoIds: z.array(z.string()).optional(),
  sortOrder: z.number().int().optional(),
});

const BulkCreateSchema = z.object({
  items: z.array(CreateChecklistItemSchema),
});

const ReorderSchema = z.object({
  itemIds: z.array(z.string().uuid()),
});

// POST /api/site-inspections/:inspectionId/checklist-items - Create item
checklistItemsRouter.post(
  '/site-inspections/:inspectionId/checklist-items',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const inspectionId = req.params.inspectionId as string;
      const parsed = CreateChecklistItemSchema.safeParse(req.body);

      if (!parsed.success) {
        res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.flatten().fieldErrors,
        });
        return;
      }

      const item = await service.create({
        ...parsed.data,
        inspectionId,
      });
      res.status(201).json(item);
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/site-inspections/:inspectionId/checklist-items/bulk - Bulk create
checklistItemsRouter.post(
  '/site-inspections/:inspectionId/checklist-items/bulk',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const inspectionId = req.params.inspectionId as string;
      const parsed = BulkCreateSchema.safeParse(req.body);

      if (!parsed.success) {
        res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.flatten().fieldErrors,
        });
        return;
      }

      const items = await service.bulkCreate(
        parsed.data.items.map((item) => ({
          ...item,
          inspectionId,
        }))
      );
      res.status(201).json(items);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/site-inspections/:inspectionId/checklist-items - List items
checklistItemsRouter.get(
  '/site-inspections/:inspectionId/checklist-items',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const inspectionId = req.params.inspectionId as string;
      const { category, decision, grouped } = req.query;

      if (grouped === 'true') {
        const groupedItems = await service.getGroupedByCategory(inspectionId);
        res.json(groupedItems);
        return;
      }

      const items = await service.findAll({
        inspectionId,
        category: category as typeof checklistCategories[number] | undefined,
        decision: decision as typeof decisions[number] | undefined,
      });
      res.json(items);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/site-inspections/:inspectionId/checklist-summary - Get summary
checklistItemsRouter.get(
  '/site-inspections/:inspectionId/checklist-summary',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const inspectionId = req.params.inspectionId as string;
      const summary = await service.getSummary(inspectionId);
      res.json(summary);
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/site-inspections/:inspectionId/checklist-items/reorder - Reorder items
checklistItemsRouter.put(
  '/site-inspections/:inspectionId/checklist-items/reorder',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const inspectionId = req.params.inspectionId as string;
      const parsed = ReorderSchema.safeParse(req.body);

      if (!parsed.success) {
        res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.flatten().fieldErrors,
        });
        return;
      }

      await service.reorder(inspectionId, parsed.data.itemIds);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/checklist-items/:id - Get item by ID
checklistItemsRouter.get(
  '/checklist-items/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const item = await service.findById(id);
      res.json(item);
    } catch (error) {
      if (error instanceof ChecklistItemNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }
);

// PUT /api/checklist-items/:id - Update item
checklistItemsRouter.put(
  '/checklist-items/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const parsed = UpdateChecklistItemSchema.safeParse(req.body);

      if (!parsed.success) {
        res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.flatten().fieldErrors,
        });
        return;
      }

      const item = await service.update(id, parsed.data);
      res.json(item);
    } catch (error) {
      if (error instanceof ChecklistItemNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }
);

// DELETE /api/checklist-items/:id - Delete item
checklistItemsRouter.delete(
  '/checklist-items/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      await service.delete(id);
      res.status(204).send();
    } catch (error) {
      if (error instanceof ChecklistItemNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }
);
