import { Router, type Request, type Response, type NextFunction, type Router as RouterType } from 'express';
import * as fs from 'node:fs/promises';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { PrismaInspectionPhotoRepository } from '../repositories/prisma/inspection-photo.js';
import {
  InspectionPhotoService,
  InspectionPhotoNotFoundError,
  InvalidBase64Error,
} from '../services/inspection-photo.js';

const prisma = new PrismaClient();
const repository = new PrismaInspectionPhotoRepository(prisma);
const service = new InspectionPhotoService(repository);

export const inspectionPhotosRouter: RouterType = Router();

// Enums for validation
const PhotoSourceEnum = z.enum(['SITE', 'OWNER', 'CONTRACTOR']);
const LinkedItemTypeEnum = z.enum(['ChecklistItem', 'ClauseReview']);

// Validation schemas
const UploadPhotoSchema = z.object({
  base64Data: z.string().min(1, 'Base64 data is required'),
  mimeType: z.string().optional(),
  caption: z.string().min(1, 'Caption is required'),
  source: PhotoSourceEnum.optional(),
  inspectionId: z.string().uuid().optional(),
  linkedClauses: z.array(z.string()).optional(),
  linkedItemId: z.string().uuid().optional(),
  linkedItemType: LinkedItemTypeEnum.optional(),
});

const UpdatePhotoSchema = z.object({
  caption: z.string().min(1).optional(),
  source: PhotoSourceEnum.optional(),
  linkedClauses: z.array(z.string()).optional(),
  linkedItemId: z.string().uuid().nullable().optional(),
  linkedItemType: LinkedItemTypeEnum.nullable().optional(),
  sortOrder: z.number().int().optional(),
});

const ReorderPhotosSchema = z.object({
  photoIds: z.array(z.string().uuid()),
});

// POST /api/projects/:projectId/inspection-photos - Upload photo
inspectionPhotosRouter.post(
  '/projects/:projectId/inspection-photos',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const projectId = req.params.projectId as string;
      const parsed = UploadPhotoSchema.safeParse(req.body);

      if (!parsed.success) {
        res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.flatten().fieldErrors,
        });
        return;
      }

      const photo = await service.upload({
        projectId,
        ...parsed.data,
      });

      res.status(201).json(photo);
    } catch (error) {
      if (error instanceof InvalidBase64Error) {
        res.status(400).json({ error: error.message });
        return;
      }
      next(error);
    }
  }
);

// GET /api/projects/:projectId/inspection-photos - List photos for project
inspectionPhotosRouter.get(
  '/projects/:projectId/inspection-photos',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const projectId = req.params.projectId as string;
      const photos = await service.findByProjectId(projectId);
      res.json(photos);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/inspections/:inspectionId/photos - List photos for inspection
inspectionPhotosRouter.get(
  '/inspections/:inspectionId/photos',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const inspectionId = req.params.inspectionId as string;
      const photos = await service.findByInspectionId(inspectionId);
      res.json(photos);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/inspection-photos/:id - Get photo metadata
inspectionPhotosRouter.get(
  '/inspection-photos/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const photo = await service.findById(id);
      res.json(photo);
    } catch (error) {
      if (error instanceof InspectionPhotoNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }
);

// GET /api/inspection-photos/:id/file - Download photo file
inspectionPhotosRouter.get(
  '/inspection-photos/:id/file',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const photo = await service.findById(id);

      // Check if file exists
      try {
        await fs.access(photo.filePath);
      } catch {
        res.status(404).json({ error: 'Photo file not found on disk' });
        return;
      }

      // Serve the file
      res.setHeader('Content-Type', photo.mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${photo.filename}"`);
      
      const fileBuffer = await fs.readFile(photo.filePath);
      res.send(fileBuffer);
    } catch (error) {
      if (error instanceof InspectionPhotoNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }
);

// PUT /api/inspection-photos/:id - Update photo metadata
inspectionPhotosRouter.put(
  '/inspection-photos/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const parsed = UpdatePhotoSchema.safeParse(req.body);

      if (!parsed.success) {
        res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.flatten().fieldErrors,
        });
        return;
      }

      const updateData = {
        ...parsed.data,
        linkedItemId: parsed.data.linkedItemId === null ? undefined : parsed.data.linkedItemId,
        linkedItemType: parsed.data.linkedItemType === null ? undefined : parsed.data.linkedItemType,
      };

      const photo = await service.update(id, updateData);
      res.json(photo);
    } catch (error) {
      if (error instanceof InspectionPhotoNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }
);

// DELETE /api/inspection-photos/:id - Delete photo
inspectionPhotosRouter.delete(
  '/inspection-photos/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      await service.delete(id);
      res.status(204).send();
    } catch (error) {
      if (error instanceof InspectionPhotoNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }
);

// PUT /api/projects/:projectId/inspection-photos/reorder - Reorder photos
inspectionPhotosRouter.put(
  '/projects/:projectId/inspection-photos/reorder',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const projectId = req.params.projectId as string;
      const parsed = ReorderPhotosSchema.safeParse(req.body);

      if (!parsed.success) {
        res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.flatten().fieldErrors,
        });
        return;
      }

      await service.reorder(projectId, parsed.data.photoIds);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);
