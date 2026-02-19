import { Router, type Request, type Response, type NextFunction, type Router as RouterType } from 'express';
import * as fs from 'node:fs/promises';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { PrismaInspectionRepository } from '../repositories/prisma/inspection.js';
import {
  PhotoService,
  PhotoNotFoundError,
  FindingNotFoundError,
  InvalidBase64Error,
} from '../services/photo.js';

const prisma = new PrismaClient();
const repository = new PrismaInspectionRepository(prisma);
const service = new PhotoService(repository);

export const photosRouter: RouterType = Router();

// Validation schema
const UploadPhotoSchema = z.object({
  base64Data: z.string().min(1, 'Base64 data is required'),
  mimeType: z.string().optional(),
});

// POST /api/findings/:findingId/photos - Upload photo to finding
photosRouter.post(
  '/findings/:findingId/photos',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const findingId = req.params.findingId as string;
      const parsed = UploadPhotoSchema.safeParse(req.body);

      if (!parsed.success) {
        res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.flatten().fieldErrors,
        });
        return;
      }

      const photo = await service.upload({
        findingId,
        base64Data: parsed.data.base64Data,
        mimeType: parsed.data.mimeType,
      });

      res.status(201).json(photo);
    } catch (error) {
      if (error instanceof FindingNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      if (error instanceof InvalidBase64Error) {
        res.status(400).json({ error: error.message });
        return;
      }
      next(error);
    }
  }
);

// GET /api/photos/:id - Get photo (serve file)
photosRouter.get('/photos/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const photo = await service.findById(id);

    // Check if file exists
    try {
      await fs.access(photo.path);
    } catch {
      res.status(404).json({ error: 'Photo file not found on disk' });
      return;
    }

    // Serve the file
    res.setHeader('Content-Type', photo.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${photo.filename}"`);
    
    const fileBuffer = await fs.readFile(photo.path);
    res.send(fileBuffer);
  } catch (error) {
    if (error instanceof PhotoNotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    next(error);
  }
});

// GET /api/photos/:id/metadata - Get photo metadata
photosRouter.get('/photos/:id/metadata', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const photo = await service.findById(id);
    res.json(photo);
  } catch (error) {
    if (error instanceof PhotoNotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    next(error);
  }
});

// DELETE /api/photos/:id - Delete photo
photosRouter.delete('/photos/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    await service.delete(id);
    res.status(204).send();
  } catch (error) {
    if (error instanceof PhotoNotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    next(error);
  }
});
