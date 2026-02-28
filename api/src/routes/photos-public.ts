/**
 * Public Photos Route
 * Issue #524 - Photos must be accessible without auth for <img> tags
 * 
 * This route serves photo files without authentication.
 * Photos are identified by UUID which provides security through obscurity.
 * Supports both R2 storage (production) and local disk (development).
 */

import { Router, type Request, type Response, type NextFunction, type Router as RouterType } from 'express';
import { PrismaClient } from '@prisma/client';
import { PrismaInspectionRepository } from '../repositories/prisma/inspection.js';
import { PhotoService, PhotoNotFoundError } from '../services/photo.js';

const prisma = new PrismaClient();
const repository = new PrismaInspectionRepository(prisma);
const service = new PhotoService(repository);

export const photosPublicRouter: RouterType = Router();

// GET /api/photos/:id - Serve photo file (public, no auth)
photosPublicRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const photo = await service.findById(id);

    // Get file buffer (from R2 or local disk)
    let fileBuffer: Buffer;
    try {
      fileBuffer = await service.getFileBuffer(id);
    } catch (err) {
      console.error(`[PhotosPublic] Failed to get file buffer for ${id}:`, err);
      res.status(404).json({ error: 'Photo file not found' });
      return;
    }

    // Set cache headers (photos are immutable)
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Content-Type', photo.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${photo.filename}"`);
    
    res.send(fileBuffer);
  } catch (error) {
    if (error instanceof PhotoNotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    next(error);
  }
});
