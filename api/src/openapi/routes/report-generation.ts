/**
 * OpenAPI Route Registration for Report Generation
 * Issue #497
 */

import { z } from '../setup.js';
import { registry } from '../registry.js';
import { ErrorResponseSchema } from '../schemas/common.js';
import { BadRequestErrorSchema, ConflictErrorSchema } from '../schemas/errors.js';

// ============================================
// Schemas
// ============================================

const JobStatusEnum = z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED']);

const QueuedJobResponseSchema = z.object({
  jobId: z.string().uuid(),
  inspectionId: z.string().uuid(),
  status: JobStatusEnum,
  message: z.string(),
}).openapi('QueuedJobResponse');

const JobStatusResponseSchema = z.object({
  id: z.string().uuid(),
  inspectionId: z.string().uuid(),
  status: JobStatusEnum,
  progress: z.number().min(0).max(100).nullable(),
  error: z.string().nullable(),
  createdAt: z.string().datetime(),
  startedAt: z.string().datetime().nullable(),
  completedAt: z.string().datetime().nullable(),
}).openapi('JobStatusResponse');

const CancelledJobResponseSchema = z.object({
  jobId: z.string().uuid(),
  status: z.literal('CANCELLED'),
  message: z.string(),
}).openapi('CancelledJobResponse');

const DocxReportDataSchema = z.object({
  companyName: z.string().openapi({
    description: 'Company name',
    example: 'Acme Building Inspections Ltd',
  }),
  reportTitle: z.string().openapi({
    description: 'Report title',
    example: 'Pre-Purchase Building Inspection Report',
  }),
  address: z.string().openapi({
    description: 'Property address',
    example: '123 Main Street, Auckland 1010',
  }),
  clientName: z.string().optional(),
  inspectionDate: z.string().optional(),
  findings: z.array(z.object({
    title: z.string(),
    description: z.string(),
    severity: z.string().optional(),
  })).optional(),
}).openapi('DocxReportData');

const DocxGeneratedResponseSchema = z.object({
  reportId: z.string().uuid(),
  format: z.literal('docx'),
  outputPath: z.string(),
  fileSize: z.number().int(),
  message: z.string(),
}).openapi('DocxGeneratedResponse');

// ============================================
// Routes
// ============================================

// POST /api/reports/:id/generate - Queue a generation job
registry.registerPath({
  method: 'post',
  path: '/api/reports/{id}/generate',
  summary: 'Queue a report generation job',
  description: 'Queue a report generation job for an inspection. The :id parameter is the inspectionId.',
  tags: ['Report Generation'],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: 'Inspection ID' }),
    }),
  },
  responses: {
    202: {
      description: 'Job queued successfully',
      content: {
        'application/json': { schema: QueuedJobResponseSchema },
      },
    },
    409: {
      description: 'Job already in progress for this inspection',
      content: {
        'application/json': { schema: ConflictErrorSchema },
      },
    },
  },
});

// GET /api/reports/:id/generate/status - Poll job status
registry.registerPath({
  method: 'get',
  path: '/api/reports/{id}/generate/status',
  summary: 'Get generation job status',
  description: 'Poll the status of the latest generation job for an inspection. The :id parameter is the inspectionId.',
  tags: ['Report Generation'],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: 'Inspection ID' }),
    }),
  },
  responses: {
    200: {
      description: 'Job status',
      content: {
        'application/json': { schema: JobStatusResponseSchema },
      },
    },
    404: {
      description: 'No job found for this inspection',
      content: {
        'application/json': { schema: ErrorResponseSchema },
      },
    },
  },
});

// DELETE /api/reports/jobs/:jobId/generate - Cancel a pending job
registry.registerPath({
  method: 'delete',
  path: '/api/reports/jobs/{jobId}/generate',
  summary: 'Cancel a pending generation job',
  tags: ['Report Generation'],
  request: {
    params: z.object({
      jobId: z.string().uuid().openapi({ description: 'Generation job ID' }),
    }),
  },
  responses: {
    200: {
      description: 'Job cancelled',
      content: {
        'application/json': { schema: CancelledJobResponseSchema },
      },
    },
    404: {
      description: 'Job not found',
      content: {
        'application/json': { schema: ErrorResponseSchema },
      },
    },
    409: {
      description: 'Cannot cancel job in current state',
      content: {
        'application/json': { schema: ConflictErrorSchema },
      },
    },
  },
});

// POST /api/reports/:id/generate/docx - Generate DOCX from report data
registry.registerPath({
  method: 'post',
  path: '/api/reports/{id}/generate/docx',
  summary: 'Generate DOCX document',
  description: 'Generate a DOCX document from report data. The :id parameter is the reportId.',
  tags: ['Report Generation'],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: 'Report ID' }),
    }),
    body: {
      content: {
        'application/json': { schema: DocxReportDataSchema },
      },
    },
  },
  responses: {
    201: {
      description: 'DOCX generated successfully',
      content: {
        'application/json': { schema: DocxGeneratedResponseSchema },
      },
    },
    400: {
      description: 'Missing required fields',
      content: {
        'application/json': { schema: BadRequestErrorSchema },
      },
    },
  },
});
