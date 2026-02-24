import { Router, type Request, type Response, type NextFunction, type Router as RouterType } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
// Personnel routes — manages CRUD operations for personnel records
import { PrismaPersonnelRepository } from '../repositories/prisma/personnel.js';
import { PersonnelService, PersonnelNotFoundError, PersonnelEmailConflictError } from '../services/personnel.js';

const prisma = new PrismaClient();
const repository = new PrismaPersonnelRepository(prisma);
const service = new PersonnelService(repository);

export const personnelRouter: RouterType = Router();

const PersonnelRoleEnum = z.enum([
  'REGISTERED_BUILDING_SURVEYOR',
  'BUILDING_SURVEYOR',
  'INSPECTOR',
  'ADMIN',
]);

// Validation schemas
const CreatePersonnelSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  role: PersonnelRoleEnum,
});

const UpdatePersonnelSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email('Invalid email').optional(),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  role: PersonnelRoleEnum.optional(),
  active: z.boolean().optional(),
});

// POST /api/personnel - Create personnel
personnelRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = CreatePersonnelSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const personnel = await service.create(parsed.data);
    res.status(201).json(personnel);
  } catch (error) {
    if (error instanceof PersonnelEmailConflictError) {
      res.status(409).json({ error: error.message });
      return;
    }
    next(error);
  }
});

// GET /api/personnel - List personnel with optional filters
personnelRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { role, active, name } = req.query;

    let parsedRole: z.infer<typeof PersonnelRoleEnum> | undefined;
    if (role) {
      const roleParsed = PersonnelRoleEnum.safeParse(role);
      if (!roleParsed.success) {
        res.status(400).json({ error: `Invalid role. Must be one of: ${PersonnelRoleEnum.options.join(', ')}` });
        return;
      }
      parsedRole = roleParsed.data;
    }

    const personnel = await service.findAll({
      role: parsedRole,
      active: active !== undefined ? active === 'true' : undefined,
      name: name as string | undefined,
    });
    res.json(personnel);
  } catch (error) {
    next(error);
  }
});

// GET /api/personnel/:id - Get personnel by ID
personnelRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const personnel = await service.findById(req.params.id as string);
    res.json(personnel);
  } catch (error) {
    if (error instanceof PersonnelNotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    next(error);
  }
});

// PUT /api/personnel/:id - Update personnel
personnelRouter.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = UpdatePersonnelSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const personnel = await service.update(req.params.id as string, parsed.data);
    res.json(personnel);
  } catch (error) {
    if (error instanceof PersonnelNotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    if (error instanceof PersonnelEmailConflictError) {
      res.status(409).json({ error: error.message });
      return;
    }
    next(error);
  }
});

// DELETE /api/personnel/:id - Soft delete (deactivate)
personnelRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const personnel = await service.deactivate(req.params.id as string);
    res.json(personnel);
  } catch (error) {
    if (error instanceof PersonnelNotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    next(error);
  }
});
