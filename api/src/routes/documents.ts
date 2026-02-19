import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { PrismaDocumentRepository } from '../repositories/prisma/document.js';
import { DocumentService, DocumentNotFoundError } from '../services/document.js';

const prisma = new PrismaClient();
const repository = new PrismaDocumentRepository(prisma);
const service = new DocumentService(repository);

export const documentsRouter = Router();

// Validation schemas
const DocumentTypeEnum = z.enum([
  'PS1', 'PS2', 'PS3', 'PS4', 'COC', 'ESC',
  'WARRANTY', 'INVOICE', 'DRAWING', 'REPORT',
  'FLOOD_TEST', 'PROPERTY_FILE', 'OTHER',
]);

const DocumentStatusEnum = z.enum(['REQUIRED', 'RECEIVED', 'OUTSTANDING', 'NA']);

const CreateDocumentSchema = z.object({
  filePath: z.string().min(1, 'File path is required'),
  filename: z.string().min(1, 'Filename is required'),
  documentType: DocumentTypeEnum,
  description: z.string().min(1, 'Description is required'),
  appendixLetter: z.string().max(2).optional(),
  issuer: z.string().optional(),
  issuedAt: z.string().datetime().optional(),
  referenceNumber: z.string().optional(),
  status: DocumentStatusEnum.optional(),
  verified: z.boolean().optional(),
  linkedClauses: z.array(z.string()).optional(),
  sortOrder: z.number().int().optional(),
});

const UpdateDocumentSchema = z.object({
  filePath: z.string().min(1).optional(),
  filename: z.string().min(1).optional(),
  documentType: DocumentTypeEnum.optional(),
  description: z.string().min(1).optional(),
  appendixLetter: z.string().max(2).optional(),
  issuer: z.string().nullable().optional(),
  issuedAt: z.string().datetime().nullable().optional(),
  referenceNumber: z.string().nullable().optional(),
  status: DocumentStatusEnum.optional(),
  verified: z.boolean().optional(),
  linkedClauses: z.array(z.string()).optional(),
  sortOrder: z.number().int().optional(),
});

const ReorderDocumentsSchema = z.object({
  documentIds: z.array(z.string().uuid()),
});

// POST /api/projects/:projectId/documents - Create document
documentsRouter.post(
  '/projects/:projectId/documents',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const projectId = req.params.projectId as string;
      const parsed = CreateDocumentSchema.safeParse(req.body);

      if (!parsed.success) {
        res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.flatten().fieldErrors,
        });
        return;
      }

      const document = await service.create({
        ...parsed.data,
        projectId,
        issuedAt: parsed.data.issuedAt ? new Date(parsed.data.issuedAt) : undefined,
      });
      res.status(201).json(document);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/projects/:projectId/documents - List documents for a project
documentsRouter.get(
  '/projects/:projectId/documents',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const projectId = req.params.projectId as string;
      const { documentType, status } = req.query;

      const documents = await service.findAll({
        projectId,
        documentType: documentType as typeof DocumentTypeEnum._type | undefined,
        status: status as typeof DocumentStatusEnum._type | undefined,
      });
      res.json(documents);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/projects/:projectId/documents/summary - Get document summary
documentsRouter.get(
  '/projects/:projectId/documents/summary',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const projectId = req.params.projectId as string;
      const summary = await service.getSummary(projectId);
      res.json(summary);
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/projects/:projectId/documents/reorder - Reorder documents
documentsRouter.put(
  '/projects/:projectId/documents/reorder',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const projectId = req.params.projectId as string;
      const parsed = ReorderDocumentsSchema.safeParse(req.body);

      if (!parsed.success) {
        res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.flatten().fieldErrors,
        });
        return;
      }

      await service.reorder(projectId, parsed.data.documentIds);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/projects/:projectId/documents/can-finalize - Check if ready to finalize
documentsRouter.get(
  '/projects/:projectId/documents/can-finalize',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const projectId = req.params.projectId as string;
      const result = await service.canFinalize(projectId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/documents/:id - Get document by ID
documentsRouter.get(
  '/documents/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const document = await service.findById(id);
      res.json(document);
    } catch (error) {
      if (error instanceof DocumentNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }
);

// PUT /api/documents/:id - Update document
documentsRouter.put(
  '/documents/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const parsed = UpdateDocumentSchema.safeParse(req.body);

      if (!parsed.success) {
        res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.flatten().fieldErrors,
        });
        return;
      }

      const updateData = {
        ...parsed.data,
        issuedAt: parsed.data.issuedAt === null 
          ? null 
          : parsed.data.issuedAt 
            ? new Date(parsed.data.issuedAt) 
            : undefined,
      };

      const document = await service.update(id, updateData);
      res.json(document);
    } catch (error) {
      if (error instanceof DocumentNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }
);

// DELETE /api/documents/:id - Delete document
documentsRouter.delete(
  '/documents/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      await service.delete(id);
      res.status(204).send();
    } catch (error) {
      if (error instanceof DocumentNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }
);

// POST /api/documents/:id/verify - Mark document as verified
documentsRouter.post(
  '/documents/:id/verify',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const document = await service.verify(id, true);
      res.json(document);
    } catch (error) {
      if (error instanceof DocumentNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }
);

// POST /api/documents/:id/unverify - Mark document as unverified
documentsRouter.post(
  '/documents/:id/unverify',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const document = await service.verify(id, false);
      res.json(document);
    } catch (error) {
      if (error instanceof DocumentNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }
);

// POST /api/documents/:id/status/:status - Update document status
documentsRouter.post(
  '/documents/:id/status/:status',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const status = req.params.status as string;

      const validStatuses = ['REQUIRED', 'RECEIVED', 'OUTSTANDING', 'NA'];
      if (!validStatuses.includes(status.toUpperCase())) {
        res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
        return;
      }

      let document;
      switch (status.toUpperCase()) {
        case 'RECEIVED':
          document = await service.markAsReceived(id);
          break;
        case 'OUTSTANDING':
          document = await service.markAsOutstanding(id);
          break;
        case 'NA':
          document = await service.markAsNA(id);
          break;
        default:
          document = await service.update(id, { status: status.toUpperCase() as 'REQUIRED' });
      }

      res.json(document);
    } catch (error) {
      if (error instanceof DocumentNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }
);

// POST /api/documents/:id/link-clauses - Link document to clauses
documentsRouter.post(
  '/documents/:id/link-clauses',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const { clauseCodes } = req.body;

      if (!Array.isArray(clauseCodes)) {
        res.status(400).json({ error: 'clauseCodes must be an array' });
        return;
      }

      const document = await service.linkClauses(id, clauseCodes);
      res.json(document);
    } catch (error) {
      if (error instanceof DocumentNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }
);
