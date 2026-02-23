/**
 * OpenAPI Route Registration for Reports
 * Issue #431
 */

import { z } from '../setup.js';
import { registry } from '../registry.js';
import {
  GenerateReportSchema,
  ReportResponseSchema,
} from '../schemas/report.js';
import { ValidationErrorSchema, NotFoundErrorSchema } from '../schemas/inspection.js';
import { ErrorResponseSchema } from '../schemas/common.js';

// Path parameter schema
const ReportInspectionIdParam = z.object({
  inspectionId: z.string().uuid().openapi({ description: 'Inspection ID' }),
});

// Query parameter schema
const ReportFormatQuerySchema = z.object({
  format: z.enum(['pdf', 'docx']).default('pdf').openapi({ description: 'Report format' }),
});

// GET /api/reports/:inspectionId - Generate report
registry.registerPath({
  method: 'get',
  path: '/api/reports/{inspectionId}',
  summary: 'Generate inspection report',
  description: 'Generate a PDF or DOCX report for an inspection.',
  tags: ['Reports'],
  request: {
    params: ReportInspectionIdParam,
    query: ReportFormatQuerySchema,
  },
  responses: {
    200: {
      description: 'Report generated successfully',
      content: {
        'application/json': { schema: ReportResponseSchema },
        'application/pdf': {
          schema: { type: 'string', format: 'binary' },
        },
      },
    },
    404: {
      description: 'Inspection not found',
      content: {
        'application/json': { schema: NotFoundErrorSchema },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': { schema: ErrorResponseSchema },
      },
    },
  },
});

// POST /api/reports - Generate report with options
registry.registerPath({
  method: 'post',
  path: '/api/reports',
  summary: 'Generate report with options',
  description: 'Generate a report with custom options.',
  tags: ['Reports'],
  request: {
    body: {
      content: {
        'application/json': { schema: GenerateReportSchema },
      },
      required: true,
    },
  },
  responses: {
    200: {
      description: 'Report generated successfully',
      content: {
        'application/json': { schema: ReportResponseSchema },
      },
    },
    400: {
      description: 'Validation error',
      content: {
        'application/json': { schema: ValidationErrorSchema },
      },
    },
    404: {
      description: 'Inspection not found',
      content: {
        'application/json': { schema: NotFoundErrorSchema },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': { schema: ErrorResponseSchema },
      },
    },
  },
});
