import { Router, type Request, type Response, type NextFunction, type Router as RouterType } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { PrismaReportTemplateRepository } from '../repositories/prisma/report-template.js';
import { ReportTemplateService, ReportTemplateNotFoundError } from '../services/report-template.js';
import {
  substituteVariables,
  getAvailableVariables,
  type VariableContext,
} from '../services/variable-substitution.js';

const prisma = new PrismaClient();
const repository = new PrismaReportTemplateRepository(prisma);
const service = new ReportTemplateService(repository);

export const reportTemplatesRouter: RouterType = Router();

const TemplateTypeEnum = z.enum(['SECTION', 'BOILERPLATE', 'METHODOLOGY']);
const ReportTypeEnum = z.enum(['COA', 'CCC_GAP', 'PPI', 'SAFE_SANITARY', 'TFA']);

const CreateTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  type: TemplateTypeEnum,
  reportType: ReportTypeEnum.optional(),
  content: z.string().min(1),
  variables: z.array(z.string()).optional(),
  isDefault: z.boolean().optional(),
});

const UpdateTemplateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  variables: z.array(z.string()).optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

const CreateVersionSchema = z.object({
  content: z.string().min(1),
  variables: z.array(z.string()).optional(),
  isDefault: z.boolean().optional(),
});

const RenderContextSchema = z.object({
  context: z.object({
    project: z.object({
      address: z.string(),
      activity: z.string(),
      jobNumber: z.string(),
      reportType: z.string(),
    }),
    property: z.object({
      lotDp: z.string(),
      councilPropertyId: z.string(),
      territorialAuthority: z.string(),
    }),
    client: z.object({
      name: z.string(),
      address: z.string(),
      phone: z.string(),
      email: z.string(),
      contactPerson: z.string(),
    }),
    company: z.object({
      name: z.string(),
      address: z.string(),
      phone: z.string(),
      email: z.string(),
    }),
    personnel: z.object({
      inspectorName: z.string(),
      authorName: z.string(),
      authorCredentials: z.string(),
      reviewerName: z.string(),
      reviewerCredentials: z.string(),
    }),
    inspection: z.object({
      date: z.string(),
      weather: z.string(),
    }),
  }),
});

// Sample context for preview endpoint
const SAMPLE_CONTEXT: VariableContext = {
  project: {
    address: '123 Sample Street, Auckland 1010',
    activity: 'Pre-Purchase Inspection',
    jobNumber: 'JOB-2026-001',
    reportType: 'COA',
  },
  property: {
    lotDp: 'Lot 1 DP 12345',
    councilPropertyId: 'AKL-12345',
    territorialAuthority: 'Auckland Council',
  },
  client: {
    name: 'John Smith',
    address: '456 Client Road, Wellington 6011',
    phone: '+64 21 123 4567',
    email: 'john.smith@example.com',
    contactPerson: 'John Smith',
  },
  company: {
    name: 'Acme Inspections Ltd',
    address: '789 Inspector Lane, Christchurch 8011',
    phone: '+64 3 987 6543',
    email: 'info@acme-inspections.co.nz',
  },
  personnel: {
    inspectorName: 'Jane Inspector',
    authorName: 'Jane Inspector',
    authorCredentials: 'LBP, NZIBS',
    reviewerName: 'Bob Reviewer',
    reviewerCredentials: 'LBP, NZIBS, BOINZ',
  },
  inspection: {
    date: '25 February 2026',
    weather: 'Fine, 22°C',
  },
};

function notFound(res: Response, err: unknown): void {
  if (err instanceof ReportTemplateNotFoundError) {
    res.status(404).json({ error: err.message });
  }
}

// POST /api/templates — Create template
reportTemplatesRouter.post(
  '/templates',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = CreateTemplateSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors });
        return;
      }
      const template = await service.create(parsed.data);
      res.status(201).json(template);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/templates — List templates (with optional filters)
reportTemplatesRouter.get(
  '/templates',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type, reportType, isDefault, isActive, name } = req.query as Record<string, string | undefined>;

      const templates = await service.findAll({
        type: type ? (type as z.infer<typeof TemplateTypeEnum>) : undefined,
        reportType: reportType ? (reportType as z.infer<typeof ReportTypeEnum>) : undefined,
        isDefault: isDefault !== undefined ? isDefault === 'true' : undefined,
        isActive: isActive !== undefined ? isActive === 'true' : true,
        name,
      });

      res.json(templates);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/templates/variables — List all available variables
// IMPORTANT: This route MUST be registered BEFORE /templates/:id to avoid :id capturing "variables"
reportTemplatesRouter.get(
  '/templates/variables',
  (_req: Request, res: Response) => {
    const variables = getAvailableVariables();
    res.json({ variables });
  }
);

// GET /api/templates/:id — Get single template
reportTemplatesRouter.get(
  '/templates/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const template = await service.findById(req.params.id as string);
      res.json(template);
    } catch (error) {
      if (error instanceof ReportTemplateNotFoundError) { notFound(res, error); return; }
      next(error);
    }
  }
);

// PUT /api/templates/:id — Update template
reportTemplatesRouter.put(
  '/templates/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = UpdateTemplateSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors });
        return;
      }
      const template = await service.update(req.params.id as string, parsed.data);
      res.json(template);
    } catch (error) {
      if (error instanceof ReportTemplateNotFoundError) { notFound(res, error); return; }
      next(error);
    }
  }
);

// DELETE /api/templates/:id — Delete template
reportTemplatesRouter.delete(
  '/templates/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await service.delete(req.params.id as string);
      res.status(204).send();
    } catch (error) {
      if (error instanceof ReportTemplateNotFoundError) { notFound(res, error); return; }
      next(error);
    }
  }
);

// POST /api/templates/:id/versions — Create new version
reportTemplatesRouter.post(
  '/templates/:id/versions',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = CreateVersionSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors });
        return;
      }
      const template = await service.createVersion(req.params.id as string, parsed.data);
      res.status(201).json(template);
    } catch (error) {
      if (error instanceof ReportTemplateNotFoundError) { notFound(res, error); return; }
      next(error);
    }
  }
);

// GET /api/templates/:id/versions — List all versions
reportTemplatesRouter.get(
  '/templates/:id/versions',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const versions = await service.getVersionHistory(req.params.id as string);
      res.json(versions);
    } catch (error) {
      if (error instanceof ReportTemplateNotFoundError) { notFound(res, error); return; }
      next(error);
    }
  }
);

// POST /api/templates/:id/set-default — Mark as default
reportTemplatesRouter.post(
  '/templates/:id/set-default',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const template = await service.setDefault(req.params.id as string);
      res.json(template);
    } catch (error) {
      if (error instanceof ReportTemplateNotFoundError) { notFound(res, error); return; }
      next(error);
    }
  }
);

// POST /api/templates/:id/render — Render template with provided context
reportTemplatesRouter.post(
  '/templates/:id/render',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = RenderContextSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors });
        return;
      }

      const template = await service.findById(req.params.id as string);
      const result = substituteVariables(template.content, parsed.data.context as VariableContext);

      res.json(result);
    } catch (error) {
      if (error instanceof ReportTemplateNotFoundError) { notFound(res, error); return; }
      next(error);
    }
  }
);

// POST /api/templates/:id/preview — Preview template with sample data
reportTemplatesRouter.post(
  '/templates/:id/preview',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const template = await service.findById(req.params.id as string);
      const result = substituteVariables(template.content, SAMPLE_CONTEXT);

      res.json(result);
    } catch (error) {
      if (error instanceof ReportTemplateNotFoundError) { notFound(res, error); return; }
      next(error);
    }
  }
);
