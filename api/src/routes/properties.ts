import { Router, type Request, type Response, type NextFunction, type Router as RouterType } from 'express';
import { z } from 'zod';
import { PrismaClient, type Prisma } from '@prisma/client';
import { PrismaPropertyRepository } from '../repositories/prisma/project.js';
import { PropertyService, PropertyNotFoundError } from '../services/project.js';

const prisma = new PrismaClient();
const repository = new PrismaPropertyRepository(prisma);
const service = new PropertyService(repository);

export const propertiesRouter: RouterType = Router();

// Territorial authority enum values
const territorialAuthorities = [
  'AKL', 'WCC', 'CCC', 'HDC', 'TCC', 'DCC', 'HCC', 'PCC', 'NCC', 'ICC', 'NPDC', 'WDC', 'RDC', 'OTHER'
] as const;

// Validation schemas
const CreatePropertySchema = z.object({
  streetAddress: z.string().min(1, 'Street address is required'),
  suburb: z.string().optional(),
  city: z.string().optional(),
  postcode: z.string().optional(),
  lotDp: z.string().optional(),
  councilPropertyId: z.string().optional(),
  territorialAuthority: z.enum(territorialAuthorities),
  bcNumber: z.string().optional(),
  yearBuilt: z.number().int().min(1800).max(2100).optional(),
  siteData: z.any().optional(),
  construction: z.any().optional(),
});

const UpdatePropertySchema = z.object({
  streetAddress: z.string().min(1).optional(),
  suburb: z.string().optional(),
  city: z.string().optional(),
  postcode: z.string().optional(),
  lotDp: z.string().optional(),
  councilPropertyId: z.string().optional(),
  territorialAuthority: z.enum(territorialAuthorities).optional(),
  bcNumber: z.string().optional(),
  yearBuilt: z.number().int().min(1800).max(2100).optional(),
  siteData: z.any().optional(),
  construction: z.any().optional(),
});

// POST /api/properties - Create property
propertiesRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = CreatePropertySchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const property = await service.create({
      ...parsed.data,
      siteData: parsed.data.siteData as Prisma.InputJsonValue | undefined,
      construction: parsed.data.construction as Prisma.InputJsonValue | undefined,
    });
    res.status(201).json(property);
  } catch (error) {
    next(error);
  }
});

// GET /api/properties - List properties with optional filters
propertiesRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { address, suburb, city, territorialAuthority } = req.query;

    const properties = await service.findAll({
      address: address as string | undefined,
      suburb: suburb as string | undefined,
      city: city as string | undefined,
      territorialAuthority: territorialAuthority as typeof territorialAuthorities[number] | undefined,
    });
    res.json(properties);
  } catch (error) {
    next(error);
  }
});

// GET /api/properties/:id - Get property by ID
propertiesRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const property = await service.findById(id);
    res.json(property);
  } catch (error) {
    if (error instanceof PropertyNotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    next(error);
  }
});

// PUT /api/properties/:id - Update property
propertiesRouter.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const parsed = UpdatePropertySchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const property = await service.update(id, {
      ...parsed.data,
      siteData: parsed.data.siteData as Prisma.InputJsonValue | undefined,
      construction: parsed.data.construction as Prisma.InputJsonValue | undefined,
    });
    res.json(property);
  } catch (error) {
    if (error instanceof PropertyNotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    next(error);
  }
});
