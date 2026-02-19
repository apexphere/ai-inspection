import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { PrismaClientRepository } from '../repositories/prisma/project.js';
import { ClientService, ClientNotFoundError } from '../services/project.js';

const prisma = new PrismaClient();
const repository = new PrismaClientRepository(prisma);
const service = new ClientService(repository);

export const clientsRouter = Router();

// Validation schemas
const CreateClientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  address: z.string().optional(),
  contactPerson: z.string().optional(),
});

const UpdateClientSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  address: z.string().optional(),
  contactPerson: z.string().optional(),
});

// POST /api/clients - Create client
clientsRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = CreateClientSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    // Convert empty string to undefined for email
    const data = {
      ...parsed.data,
      email: parsed.data.email || undefined,
    };

    const client = await service.create(data);
    res.status(201).json(client);
  } catch (error) {
    next(error);
  }
});

// GET /api/clients - List clients with optional filters
clientsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email } = req.query;

    const clients = await service.findAll({
      name: name as string | undefined,
      email: email as string | undefined,
    });
    res.json(clients);
  } catch (error) {
    next(error);
  }
});

// GET /api/clients/:id - Get client by ID
clientsRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const client = await service.findById(id);
    res.json(client);
  } catch (error) {
    if (error instanceof ClientNotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    next(error);
  }
});

// PUT /api/clients/:id - Update client
clientsRouter.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const parsed = UpdateClientSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    // Convert empty string to undefined for email
    const data = {
      ...parsed.data,
      email: parsed.data.email || undefined,
    };

    const client = await service.update(id, data);
    res.json(client);
  } catch (error) {
    if (error instanceof ClientNotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    next(error);
  }
});
