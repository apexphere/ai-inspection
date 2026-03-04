/**
 * Public Photos Route
 *
 * Serves ProjectPhoto files without authentication.
 * Photos are identified by UUID which provides security through obscurity.
 * Supports both R2 storage (production) and local disk (development).
 */

import { Router, type Request, type Response, type NextFunction, type Router as RouterType } from 'express';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import { PrismaProjectPhotoRepository } from '../repositories/prisma/project-photo.js';
import { ProjectPhotoService, ProjectPhotoNotFoundError } from '../services/project-photo.js';
import { getPresignedUrl, isR2Configured } from '../services/r2-storage.js';

const prisma = new PrismaClient();
const projectPhotoRepository = new PrismaProjectPhotoRepository(prisma);
const projectPhotoService = new ProjectPhotoService(projectPhotoRepository);

const UPLOAD_DIR = process.env.UPLOAD_DIR || './data/uploads';
const useR2Storage = isR2Configured();

export const photosPublicRouter: RouterType = Router();

// GET /api/photos/:id/file - Serve project photo file (public, no auth)
photosPublicRouter.get('/:id/file', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const thumbnail = req.query.thumbnail === 'true';

    const photo = await projectPhotoService.findById(id);
    const storagePath = thumbnail && photo.thumbnailPath
      ? photo.thumbnailPath
      : photo.filePath;

    if (useR2Storage) {
      const presignedUrl = await getPresignedUrl(storagePath);
      res.redirect(presignedUrl);
      return;
    }

    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    if (photo.mimeType) {
      res.setHeader('Content-Type', photo.mimeType);
    }

    res.sendFile(storagePath, { root: path.resolve(UPLOAD_DIR) }, (err) => {
      if (err) {
        res.status(404).json({ error: 'File not found' });
      }
    });
  } catch (error) {
    if (error instanceof ProjectPhotoNotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    next(error);
  }
});
