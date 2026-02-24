/**
 * OpenAPI Route Registration for Generated Reports
 * Issue #497
 */

import { z } from '../setup.js';
import { registry } from '../registry.js';
import { ErrorResponseSchema } from '../schemas/common.js';
import { BadRequestErrorSchema } from '../schemas/errors.js';

// ============================================
// Schemas
// ============================================

const GeneratedReportSchema = z.object({
  id: z.string().uuid(),
  reportId: z.string().uuid(),
  format: z.enum(['pdf', 'docx']),
  version: z.number().int(),
  filename: z.string(),
  fileSize: z.number().int().nullable(),
  r2Key: z.string().nullable(),
  localPath: z.string().nullable(),
  generatedAt: z.string().datetime(),
  createdAt: z.string().datetime(),
}).openapi('GeneratedReport');

const GeneratedReportListSchema = z.array(GeneratedReportSchema).openapi('GeneratedReportList');

// ============================================
// Routes
// ============================================

// GET /api/reports/:id/generated - List generated files for a report
registry.registerPath({
  method: 'get',
  path: '/api/reports/{id}/generated',
  summary: 'List generated files for a report',
  description: 'Get all generated files (PDF/DOCX) for a specific report',
  tags: ['Generated Reports'],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: 'Report ID' }),
    }),
  },
  responses: {
    200: {
      description: 'List of generated files',
      content: {
        'application/json': { schema: GeneratedReportListSchema },
      },
    },
    404: {
      description: 'Report not found',
      content: {
        'application/json': { schema: ErrorResponseSchema },
      },
    },
  },
});

// GET /api/reports/:id/download/:format - Download latest by format
registry.registerPath({
  method: 'get',
  path: '/api/reports/{id}/download/{format}',
  summary: 'Download latest generated file by format',
  description: 'Download the latest generated file for a report in the specified format (pdf or docx). Redirects to presigned URL or streams local file.',
  tags: ['Generated Reports'],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: 'Report ID' }),
      format: z.enum(['pdf', 'docx']).openapi({ description: 'File format' }),
    }),
  },
  responses: {
    302: {
      description: 'Redirect to download URL',
    },
    400: {
      description: 'Invalid format',
      content: {
        'application/json': { schema: BadRequestErrorSchema },
      },
    },
    404: {
      description: 'Report or generated file not found',
      content: {
        'application/json': { schema: ErrorResponseSchema },
      },
    },
  },
});

// GET /api/generated-reports/file/:id/download - Download specific file
registry.registerPath({
  method: 'get',
  path: '/api/generated-reports/file/{id}/download',
  summary: 'Download a specific generated report file',
  description: 'Download a specific generated report file by its ID. Redirects to presigned URL or streams local file.',
  tags: ['Generated Reports'],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: 'Generated report file ID' }),
    }),
  },
  responses: {
    302: {
      description: 'Redirect to download URL',
    },
    404: {
      description: 'Generated file not found',
      content: {
        'application/json': { schema: ErrorResponseSchema },
      },
    },
  },
});
