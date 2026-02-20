import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';
import { randomUUID } from 'crypto';
import { PrismaProjectPhotoRepository } from '../repositories/prisma/project-photo.js';
import { ProjectPhotoService, ProjectPhotoNotFoundError } from '../services/project-photo.js';
import {
  isR2Configured,
  uploadPhotoWithThumbnail,
  getPresignedUrl,
  deletePhotoWithThumbnail,
  generatePhotoKey,
  generateThumbnailKey,
} from '../services/r2-storage.js';

const prisma = new PrismaClient();
const repository = new PrismaProjectPhotoRepository(prisma);
const service = new ProjectPhotoService(repository);

export const projectPhotosRouter = Router();

// Storage configuration
const UPLOAD_DIR = process.env.UPLOAD_DIR || './data/uploads';
const PHOTO_DIR = path.join(UPLOAD_DIR, 'photos');
const THUMBNAIL_SIZE = { width: 400, height: 300 };
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Use R2 in production, filesystem in development
const useR2Storage = isR2Configured();

// Ensure directories exist (for local storage)
async function ensureDirectories(projectId: string) {
  const projectDir = path.join(PHOTO_DIR, projectId);
  await fs.mkdir(projectDir, { recursive: true });
  return projectDir;
}

// Multer configuration
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/heic', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, HEIC, and WebP allowed.'));
    }
  },
});

// Enums
const photoSources = ['SITE', 'OWNER', 'CONTRACTOR'] as const;

// Validation schemas
const UpdatePhotoSchema = z.object({
  caption: z.string().min(1).max(500).optional(),
  source: z.enum(photoSources).optional(),
  linkedClauses: z.array(z.string()).max(20).optional(),
});

const ReorderSchema = z.object({
  photoIds: z.array(z.string().uuid()),
});

// Generate thumbnail buffer
async function generateThumbnailBuffer(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize(THUMBNAIL_SIZE.width, THUMBNAIL_SIZE.height, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality: 80 })
    .toBuffer();
}

// Generate thumbnail to file (for local storage)
async function generateThumbnailToFile(buffer: Buffer, outputPath: string): Promise<void> {
  await sharp(buffer)
    .resize(THUMBNAIL_SIZE.width, THUMBNAIL_SIZE.height, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality: 80 })
    .toFile(outputPath);
}

// Process image buffer (resize, convert to JPEG)
async function processImageBuffer(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize(1920, 1440, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();
}

// Upload photo (handles both R2 and local storage)
async function uploadPhoto(
  projectId: string,
  buffer: Buffer,
  originalFilename: string
): Promise<{ filePath: string; thumbnailPath: string; fileSize: number }> {
  const processedBuffer = await processImageBuffer(buffer);
  const thumbnailBuffer = await generateThumbnailBuffer(buffer);

  if (useR2Storage) {
    // Upload to R2
    const { photoKey, thumbnailKey } = await uploadPhotoWithThumbnail(
      projectId,
      processedBuffer,
      thumbnailBuffer,
      'image/jpeg',
      originalFilename
    );
    return {
      filePath: photoKey,
      thumbnailPath: thumbnailKey,
      fileSize: processedBuffer.length,
    };
  } else {
    // Save to local filesystem
    const projectDir = await ensureDirectories(projectId);
    const fileId = randomUUID();
    const ext = '.jpg';
    const fileName = `${fileId}${ext}`;
    const thumbName = `${fileId}_thumb${ext}`;
    const filePath = path.join(projectDir, fileName);
    const thumbPath = path.join(projectDir, thumbName);

    await fs.writeFile(filePath, processedBuffer);
    await fs.writeFile(thumbPath, thumbnailBuffer);

    return {
      filePath: path.relative(UPLOAD_DIR, filePath),
      thumbnailPath: path.relative(UPLOAD_DIR, thumbPath),
      fileSize: processedBuffer.length,
    };
  }
}

// Delete photo files (handles both R2 and local storage)
async function deletePhotoFiles(filePath: string, thumbnailPath: string | null): Promise<void> {
  if (useR2Storage) {
    await deletePhotoWithThumbnail(filePath, thumbnailPath);
  } else {
    try {
      await fs.unlink(path.join(UPLOAD_DIR, filePath));
      if (thumbnailPath) {
        await fs.unlink(path.join(UPLOAD_DIR, thumbnailPath));
      }
    } catch {
      // Ignore file deletion errors
    }
  }
}

// POST /api/projects/:projectId/photos - Upload photo
projectPhotosRouter.post(
  '/projects/:projectId/photos',
  upload.single('photo'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const projectId = req.params.projectId as string;
      const file = req.file;

      if (!file) {
        res.status(400).json({ error: 'No photo file provided' });
        return;
      }

      // Ensure project exists
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { id: true },
      });
      if (!project) {
        res.status(404).json({ error: 'Project not found' });
        return;
      }

      // Upload photo
      const { filePath, thumbnailPath, fileSize } = await uploadPhoto(
        projectId,
        file.buffer,
        file.originalname
      );

      // Parse optional metadata from body
      const caption = req.body.caption || 'Photo';
      const source = req.body.source || 'SITE';
      const linkedClauses = req.body.linkedClauses
        ? JSON.parse(req.body.linkedClauses)
        : [];

      // Create database record
      const photo = await service.create({
        projectId,
        inspectionId: req.body.inspectionId,
        filePath,
        thumbnailPath,
        mimeType: 'image/jpeg',
        fileSize,
        caption,
        source: source as 'SITE' | 'OWNER' | 'CONTRACTOR',
        linkedClauses,
      });

      res.status(201).json(photo);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/projects/:projectId/photos - List photos
projectPhotosRouter.get(
  '/projects/:projectId/photos',
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

// GET /api/photos/:id - Get photo by ID
projectPhotosRouter.get(
  '/photos/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const photo = await service.findById(id);
      res.json(photo);
    } catch (error) {
      if (error instanceof ProjectPhotoNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }
);

// GET /api/photos/:id/file - Download photo file
projectPhotosRouter.get(
  '/photos/:id/file',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const thumbnail = req.query.thumbnail === 'true';
      
      const photo = await service.findById(id);
      const storagePath = thumbnail && photo.thumbnailPath
        ? photo.thumbnailPath
        : photo.filePath;

      if (useR2Storage) {
        // Redirect to presigned URL
        const presignedUrl = await getPresignedUrl(storagePath);
        res.redirect(presignedUrl);
      } else {
        // Serve from local filesystem
        const absolutePath = path.join(UPLOAD_DIR, storagePath);
        res.sendFile(absolutePath, (err) => {
          if (err) {
            res.status(404).json({ error: 'File not found' });
          }
        });
      }
    } catch (error) {
      if (error instanceof ProjectPhotoNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }
);

// GET /api/photos/:id/url - Get presigned URL for photo (R2 only)
projectPhotosRouter.get(
  '/photos/:id/url',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const thumbnail = req.query.thumbnail === 'true';
      
      const photo = await service.findById(id);
      const storagePath = thumbnail && photo.thumbnailPath
        ? photo.thumbnailPath
        : photo.filePath;

      if (useR2Storage) {
        const presignedUrl = await getPresignedUrl(storagePath);
        res.json({ url: presignedUrl, expiresIn: 3600 });
      } else {
        // For local storage, return the file endpoint URL
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const url = `${baseUrl}/api/photos/${id}/file${thumbnail ? '?thumbnail=true' : ''}`;
        res.json({ url, expiresIn: null });
      }
    } catch (error) {
      if (error instanceof ProjectPhotoNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }
);

// PUT /api/photos/:id - Update photo metadata
projectPhotosRouter.put(
  '/photos/:id',
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

      const photo = await service.update(id, parsed.data);
      res.json(photo);
    } catch (error) {
      if (error instanceof ProjectPhotoNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }
);

// DELETE /api/photos/:id - Delete photo
projectPhotosRouter.delete(
  '/photos/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      
      // Get photo to delete files
      const photo = await service.findById(id);
      
      // Delete files
      await deletePhotoFiles(photo.filePath, photo.thumbnailPath);
      
      // Delete database record (will auto-renumber)
      await service.delete(id);
      
      res.status(204).send();
    } catch (error) {
      if (error instanceof ProjectPhotoNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }
);

// POST /api/projects/:projectId/photos/base64 - Upload photo from base64 (for MCP/WhatsApp)
const Base64UploadSchema = z.object({
  data: z.string().min(1, 'Base64 data is required'),
  filename: z.string().optional(),
  mimeType: z.string().optional(),
  caption: z.string().max(500).optional(),
  source: z.enum(photoSources).optional(),
  linkedClauses: z.array(z.string()).optional(),
  inspectionId: z.string().uuid().optional(),
});

projectPhotosRouter.post(
  '/projects/:projectId/photos/base64',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const projectId = req.params.projectId as string;
      const parsed = Base64UploadSchema.safeParse(req.body);

      if (!parsed.success) {
        res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.flatten().fieldErrors,
        });
        return;
      }

      const { data, filename, caption, source, linkedClauses, inspectionId } = parsed.data;

      // Decode base64
      const base64Data = data.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      if (buffer.length > MAX_FILE_SIZE) {
        res.status(400).json({ error: 'File too large. Maximum 10MB.' });
        return;
      }

      // Ensure project exists
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { id: true },
      });
      if (!project) {
        res.status(404).json({ error: 'Project not found' });
        return;
      }

      // Upload photo
      const { filePath, thumbnailPath, fileSize } = await uploadPhoto(
        projectId,
        buffer,
        filename || 'photo.jpg'
      );

      // Create database record
      const photo = await service.create({
        projectId,
        inspectionId,
        filePath,
        thumbnailPath,
        mimeType: 'image/jpeg',
        fileSize,
        caption: caption || 'Photo',
        source: (source || 'SITE') as 'SITE' | 'OWNER' | 'CONTRACTOR',
        linkedClauses: linkedClauses || [],
      });

      res.status(201).json(photo);
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/projects/:projectId/photos/reorder - Reorder photos
projectPhotosRouter.put(
  '/projects/:projectId/photos/reorder',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const projectId = req.params.projectId as string;
      const parsed = ReorderSchema.safeParse(req.body);

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
