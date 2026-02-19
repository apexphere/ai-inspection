import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { PrismaSiteInspectionRepository } from '../repositories/prisma/site-inspection.js';
import { SiteInspectionService, SiteInspectionNotFoundError } from '../services/site-inspection.js';

const prisma = new PrismaClient();
const repository = new PrismaSiteInspectionRepository(prisma);
const service = new SiteInspectionService(repository);

export const siteInspectionsRouter = Router();

// Inspection type and stage enums
const inspectionTypes = ['SIMPLE', 'CLAUSE_REVIEW'] as const;
const inspectionStages = [
  'INS_01', 'INS_02', 'INS_03', 'INS_04', 'INS_05', 'INS_06', 'INS_07',
  'INS_07A', 'INS_08', 'INS_09', 'INS_10', 'INS_11', 'COA', 'CCC_GA',
  'S_AND_S', 'TFA', 'DMG'
] as const;
const inspectionStatuses = ['DRAFT', 'IN_PROGRESS', 'REVIEW', 'COMPLETED'] as const;
const inspectionOutcomes = ['PASS', 'FAIL', 'REPEAT_REQUIRED'] as const;

// Validation schemas
const CreateSiteInspectionSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  type: z.enum(inspectionTypes),
  stage: z.enum(inspectionStages),
  date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  inspectorName: z.string().min(1, 'Inspector name is required'),
  weather: z.string().optional(),
  personsPresent: z.string().optional(),
  equipment: z.array(z.string()).optional(),
  methodology: z.string().optional(),
  areasNotAccessed: z.string().optional(),
});

const UpdateSiteInspectionSchema = z.object({
  type: z.enum(inspectionTypes).optional(),
  stage: z.enum(inspectionStages).optional(),
  date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  status: z.enum(inspectionStatuses).optional(),
  weather: z.string().optional(),
  personsPresent: z.string().optional(),
  equipment: z.array(z.string()).optional(),
  methodology: z.string().optional(),
  areasNotAccessed: z.string().optional(),
  inspectorName: z.string().min(1).optional(),
  lbpOnSite: z.boolean().optional(),
  lbpLicenseSighted: z.boolean().optional(),
  lbpLicenseNumber: z.string().optional(),
  lbpExpiryDate: z.string().datetime().optional(),
  outcome: z.enum(inspectionOutcomes).optional(),
  signatureData: z.string().optional(),
  signatureDate: z.string().datetime().optional(),
  currentSection: z.string().optional(),
  currentClauseId: z.string().optional(),
});

// Helper to parse date strings
function parseDate(dateStr: string): Date {
  return new Date(dateStr);
}

// POST /api/projects/:projectId/inspections - Create inspection for project
siteInspectionsRouter.post('/projects/:projectId/inspections', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = req.params.projectId as string;
    const body = { ...req.body, projectId };
    const parsed = CreateSiteInspectionSchema.safeParse(body);

    if (!parsed.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const inspection = await service.create({
      ...parsed.data,
      date: parseDate(parsed.data.date),
    });
    res.status(201).json(inspection);
  } catch (error) {
    next(error);
  }
});

// GET /api/projects/:projectId/inspections - List inspections for project
siteInspectionsRouter.get('/projects/:projectId/inspections', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = req.params.projectId as string;
    const inspections = await service.findByProjectId(projectId);
    res.json(inspections);
  } catch (error) {
    next(error);
  }
});

// GET /api/site-inspections - List all site inspections with filters
siteInspectionsRouter.get('/site-inspections', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectId, type, stage, status, includeDeleted } = req.query;

    const inspections = await service.findAll({
      projectId: projectId as string | undefined,
      type: type as typeof inspectionTypes[number] | undefined,
      stage: stage as typeof inspectionStages[number] | undefined,
      status: status as typeof inspectionStatuses[number] | undefined,
      includeDeleted: includeDeleted === 'true',
    });
    res.json(inspections);
  } catch (error) {
    next(error);
  }
});

// GET /api/site-inspections/:id - Get inspection by ID
siteInspectionsRouter.get('/site-inspections/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const inspection = await service.findById(id);
    res.json(inspection);
  } catch (error) {
    if (error instanceof SiteInspectionNotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    next(error);
  }
});

// PUT /api/site-inspections/:id - Update inspection
siteInspectionsRouter.put('/site-inspections/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const parsed = UpdateSiteInspectionSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    // Convert date strings to Date objects
    const updateData = {
      ...parsed.data,
      date: parsed.data.date ? parseDate(parsed.data.date) : undefined,
      lbpExpiryDate: parsed.data.lbpExpiryDate ? parseDate(parsed.data.lbpExpiryDate) : undefined,
      signatureDate: parsed.data.signatureDate ? parseDate(parsed.data.signatureDate) : undefined,
    };

    const inspection = await service.update(id, updateData);
    res.json(inspection);
  } catch (error) {
    if (error instanceof SiteInspectionNotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    next(error);
  }
});

// DELETE /api/site-inspections/:id - Soft delete inspection
siteInspectionsRouter.delete('/site-inspections/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    await service.softDelete(id);
    res.status(204).send();
  } catch (error) {
    if (error instanceof SiteInspectionNotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    next(error);
  }
});

// POST /api/site-inspections/:id/restore - Restore soft-deleted inspection
siteInspectionsRouter.post('/site-inspections/:id/restore', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const inspection = await service.restore(id);
    res.json(inspection);
  } catch (error) {
    if (error instanceof SiteInspectionNotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    next(error);
  }
});
