import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { PrismaCredentialRepository } from '../repositories/prisma/credential.js';
import {
  CredentialService,
  CredentialNotFoundError,
  PersonnelNotFoundError,
  InvalidLBPLicenseError,
} from '../services/credential.js';

const prisma = new PrismaClient();
const repository = new PrismaCredentialRepository(prisma);
const service = new CredentialService(repository, prisma);

export const credentialsRouter = Router();

// Validation schemas
const CredentialTypeEnum = z.enum(['NZIBS', 'LBP', 'ENG_NZ', 'ACADEMIC', 'OTHER']);

const CreateCredentialSchema = z.object({
  credentialType: CredentialTypeEnum,
  membershipCode: z.string().optional(),
  registrationTitle: z.string().optional(),
  licenseNumber: z.string().optional(),
  qualifications: z.array(z.string()).optional(),
  issuedDate: z.string().datetime().optional(),
  expiryDate: z.string().datetime().optional(),
  verified: z.boolean().optional(),
});

const UpdateCredentialSchema = z.object({
  credentialType: CredentialTypeEnum.optional(),
  membershipCode: z.string().nullable().optional(),
  registrationTitle: z.string().nullable().optional(),
  licenseNumber: z.string().nullable().optional(),
  qualifications: z.array(z.string()).optional(),
  issuedDate: z.string().datetime().nullable().optional(),
  expiryDate: z.string().datetime().nullable().optional(),
  verified: z.boolean().optional(),
});

// POST /api/personnel/:personnelId/credentials - Create credential
credentialsRouter.post(
  '/personnel/:personnelId/credentials',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const personnelId = req.params.personnelId as string;
      const parsed = CreateCredentialSchema.safeParse(req.body);

      if (!parsed.success) {
        res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.flatten().fieldErrors,
        });
        return;
      }

      const credential = await service.create({
        ...parsed.data,
        personnelId,
        issuedDate: parsed.data.issuedDate ? new Date(parsed.data.issuedDate) : undefined,
        expiryDate: parsed.data.expiryDate ? new Date(parsed.data.expiryDate) : undefined,
      });
      res.status(201).json(credential);
    } catch (error) {
      if (error instanceof PersonnelNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      if (error instanceof InvalidLBPLicenseError) {
        res.status(400).json({ error: error.message });
        return;
      }
      next(error);
    }
  }
);

// GET /api/personnel/:personnelId/credentials - List credentials for personnel
credentialsRouter.get(
  '/personnel/:personnelId/credentials',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const personnelId = req.params.personnelId as string;
      const credentials = await service.findByPersonnelId(personnelId);
      res.json(credentials);
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/credentials/:id - Update credential
credentialsRouter.put(
  '/credentials/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const parsed = UpdateCredentialSchema.safeParse(req.body);

      if (!parsed.success) {
        res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.flatten().fieldErrors,
        });
        return;
      }

      const updateData = {
        ...parsed.data,
        issuedDate: parsed.data.issuedDate === null
          ? null
          : parsed.data.issuedDate
            ? new Date(parsed.data.issuedDate)
            : undefined,
        expiryDate: parsed.data.expiryDate === null
          ? null
          : parsed.data.expiryDate
            ? new Date(parsed.data.expiryDate)
            : undefined,
      };

      const credential = await service.update(id, updateData);
      res.json(credential);
    } catch (error) {
      if (error instanceof CredentialNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      if (error instanceof InvalidLBPLicenseError) {
        res.status(400).json({ error: error.message });
        return;
      }
      next(error);
    }
  }
);

// DELETE /api/credentials/:id - Delete credential (hard delete)
credentialsRouter.delete(
  '/credentials/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      await service.delete(id);
      res.status(204).send();
    } catch (error) {
      if (error instanceof CredentialNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }
);
