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

const prisma = new PrismaClient();
const repository = new PrismaProjectPhotoRepository(prisma);
const service = new ProjectPhotoService(repository);

export const projectPhotosRouter = Router();

// Storage configuration
const UPLOAD_DIR = process.env.UPLOAD_DIR || './data/uploads';
const PHOTO_DIR = path.join(UPLOAD_DIR, 'photos');
const THUMBNAIL_SIZE = { width: 400, height: 300 };
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Ensure directories exist
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

// Generate thumbnail
async function generateThumbnail(buffer: Buffer, outputPath: string): Promise<void> {
  await sharp(buffer)
    .resize(THUMBNAIL_SIZE.width, THUMBNAIL_SIZE.height, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality: 80 })
    .toFile(outputPath);
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

      // Create directories
      const projectDir = await ensureDirectories(projectId);

      // Generate file names
      const fileId = randomUUID();
      const ext = '.jpg'; // Always save as JPEG after processing
      const fileName = `${fileId}${ext}`;
      const thumbName = `${fileId}_thumb${ext}`;
      const filePath = path.join(projectDir, fileName);
      const thumbPath = path.join(projectDir, thumbName);

      // Process and save original (convert to JPEG, compress)
      const processedBuffer = await sharp(file.buffer)
        .resize(1920, 1440, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer();
      
      await fs.writeFile(filePath, processedBuffer);

      // Generate thumbnail
      await generateThumbnail(file.buffer, thumbPath);

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
        filePath: path.relative(UPLOAD_DIR, filePath),
        thumbnailPath: path.relative(UPLOAD_DIR, thumbPath),
        mimeType: 'image/jpeg',
        fileSize: processedBuffer.length,
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
      const relativePath = thumbnail && photo.thumbnailPath
        ? photo.thumbnailPath
        : photo.filePath;
      
      const absolutePath = path.join(UPLOAD_DIR, relativePath);
      
      res.sendFile(absolutePath, (err) => {
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
      try {
        await fs.unlink(path.join(UPLOAD_DIR, photo.filePath));
        if (photo.thumbnailPath) {
          await fs.unlink(path.join(UPLOAD_DIR, photo.thumbnailPath));
        }
      } catch {
        // Ignore file deletion errors
      }
      
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

      const { data, caption, source, linkedClauses, inspectionId } = parsed.data;

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

      // Create directories
      const projectDir = await ensureDirectories(projectId);

      // Generate file names
      const fileId = randomUUID();
      const ext = '.jpg';
      const fileName = `${fileId}${ext}`;
      const thumbName = `${fileId}_thumb${ext}`;
      const filePath = path.join(projectDir, fileName);
      const thumbPath = path.join(projectDir, thumbName);

      // Process and save original
      const processedBuffer = await sharp(buffer)
        .resize(1920, 1440, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer();

      await fs.writeFile(filePath, processedBuffer);

      // Generate thumbnail
      await generateThumbnail(buffer, thumbPath);

      // Create database record
      const photo = await service.create({
        projectId,
        inspectionId,
        filePath: path.relative(UPLOAD_DIR, filePath),
        thumbnailPath: path.relative(UPLOAD_DIR, thumbPath),
        mimeType: 'image/jpeg',
        fileSize: processedBuffer.length,
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
