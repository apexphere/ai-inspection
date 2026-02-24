/**
 * Report Management Routes — Issue #192
 * 
 * CRUD + workflow endpoints for report lifecycle management.
 * Separate from legacy report generation routes in reports.ts.
 */

import { Router, type Request, type Response, type NextFunction, type Router as RouterType } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { PrismaReportManagementRepository } from '../repositories/prisma/report.js';
import { ReportManagementService, ReportNotFoundError, InvalidStatusTransitionError } from '../services/report-management.js';
import { ReportValidationService, ReportNotFoundError as ValidationReportNotFoundError } from '../services/report-validation.js';
import { generateSignatureBlock } from '../services/signature-block.js';
import { Form9ExportService, ReportNotFoundError as Form9ReportNotFoundError, InspectionNotLinkedError } from '../services/form9-export.js';

const prisma = new PrismaClient();
const repository = new PrismaReportManagementRepository(prisma);
const service = new ReportManagementService(repository);
const validationService = new ReportValidationService(prisma);

export const reportManagementRouter: RouterType = Router();

// Validation schemas
const CreateReportSchema = z.object({
  siteInspectionId: z.string().uuid('Invalid inspection ID'),
  type: z.enum(['COA', 'CCC_GAP', 'PPI', 'SAFE_SANITARY', 'TFA']),
  preparedById: z.string().min(1, 'Prepared by ID is required'),
  reviewedById: z.string().optional(),
});

const UpdateReportSchema = z.object({
  status: z.enum(['DRAFT', 'IN_REVIEW', 'APPROVED', 'FINALIZED', 'SUBMITTED']).optional(),
  preparedById: z.string().optional(),
  reviewedById: z.string().optional(),
  form9Data: z.record(z.unknown()).optional(),
});

// POST /api/reports - Create report
reportManagementRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = CreateReportSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const report = await service.create(parsed.data);
    res.status(201).json(report);
  } catch (error) {
    next(error);
  }
});

// GET /api/reports - List reports with filters
reportManagementRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { siteInspectionId, type, status, preparedById } = req.query;
    
    const reports = await service.findAll({
      siteInspectionId: siteInspectionId as string | undefined,
      type: type as 'COA' | 'CCC_GAP' | 'PPI' | 'SAFE_SANITARY' | 'TFA' | undefined,
      status: status as 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'FINALIZED' | 'SUBMITTED' | undefined,
      preparedById: preparedById as string | undefined,
    });
    res.json(reports);
  } catch (error) {
    next(error);
  }
});

// GET /api/reports/:id/validate - Validate report for generation readiness
reportManagementRouter.get('/:id/validate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const result = await validationService.validate(id);
    res.json(result);
  } catch (error) {
    if (error instanceof ValidationReportNotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    next(error);
  }
});

// GET /api/reports/:id - Get report by ID
reportManagementRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const report = await service.findById(id);
    res.json(report);
  } catch (error) {
    if (error instanceof ReportNotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    next(error);
  }
});

// PUT /api/reports/:id - Update report
reportManagementRouter.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const parsed = UpdateReportSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const report = await service.update(id, parsed.data);
    res.json(report);
  } catch (error) {
    if (error instanceof ReportNotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    if (error instanceof InvalidStatusTransitionError) {
      res.status(400).json({ error: error.message });
      return;
    }
    next(error);
  }
});

// DELETE /api/reports/:id - Delete report
reportManagementRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    await service.delete(id);
    res.status(204).send();
  } catch (error) {
    if (error instanceof ReportNotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    next(error);
  }
});

// POST /api/reports/:id/review - Submit for review
reportManagementRouter.post('/:id/review', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const report = await service.submitForReview(id);
    res.json(report);
  } catch (error) {
    if (error instanceof ReportNotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    if (error instanceof InvalidStatusTransitionError) {
      res.status(400).json({ error: error.message });
      return;
    }
    next(error);
  }
});

// POST /api/reports/:id/approve - Approve report
reportManagementRouter.post('/:id/approve', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { reviewedById } = req.body;
    
    if (!reviewedById) {
      res.status(400).json({ error: 'reviewedById is required' });
      return;
    }

    const report = await service.approve(id, reviewedById);
    res.json(report);
  } catch (error) {
    if (error instanceof ReportNotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    if (error instanceof InvalidStatusTransitionError) {
      res.status(400).json({ error: error.message });
      return;
    }
    next(error);
  }
});

// GET /api/reports/:id/signature-block - Generate signature block (#203)
reportManagementRouter.get('/:id/signature-block', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    const report = await prisma.report.findUnique({
      where: { id },
    });
    if (!report) {
      res.status(404).json({ error: `Report not found: ${id}` });
      return;
    }

    // Fetch author with credentials
    if (!report.preparedById) {
      res.status(400).json({ error: 'Report has no author (preparedById)' });
      return;
    }

    const author = await prisma.personnel.findUnique({
      where: { id: report.preparedById },
      include: { credentials: true },
    });
    if (!author) {
      res.status(404).json({ error: `Author personnel not found: ${report.preparedById}` });
      return;
    }

    // Fetch reviewer with credentials (optional)
    let reviewer = null;
    if (report.reviewedById) {
      reviewer = await prisma.personnel.findUnique({
        where: { id: report.reviewedById },
        include: { credentials: true },
      });
    }

    // Get company name (first company record or fallback)
    const company = await prisma.company.findFirst();
    const companyName = company?.name ?? '';

    const signatureBlock = generateSignatureBlock({
      author: {
        id: author.id,
        name: author.name,
        credentials: author.credentials,
      },
      reviewer: reviewer
        ? {
            id: reviewer.id,
            name: reviewer.name,
            credentials: reviewer.credentials,
          }
        : null,
      companyName,
    });

    res.json(signatureBlock);
  } catch (error) {
    next(error);
  }
});

// GET /api/reports/:id/form9 - Export Form 9 data (#196)
const form9Service = new Form9ExportService(prisma);

reportManagementRouter.get('/:id/form9', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const form9Data = await form9Service.extract(id);
    res.json(form9Data);
  } catch (error) {
    if (error instanceof Form9ReportNotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    if (error instanceof InspectionNotLinkedError) {
      res.status(400).json({ error: error.message });
      return;
    }
    next(error);
  }
});
