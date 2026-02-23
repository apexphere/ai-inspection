/**
 * OpenAPI Schemas for Report Endpoints
 * Issue #429
 */

import { z } from '../setup.js';
import { registry } from '../registry.js';

// ============================================
// Request Schemas
// ============================================

export const GenerateReportSchema = z.object({
  format: z.enum(['pdf', 'docx']).default('pdf').openapi({
    description: 'Report output format',
    example: 'pdf',
  }),
  includePhotos: z.boolean().default(true).openapi({
    description: 'Whether to include photos in the report',
  }),
  template: z.string().optional().openapi({
    description: 'Report template ID (uses default if not specified)',
    example: 'nz-ppi-standard',
  }),
}).openapi('GenerateReportRequest');

// ============================================
// Response Schemas
// ============================================

export const ReportResponseSchema = z.object({
  id: z.string().uuid().openapi({
    description: 'Report ID',
    example: '550e8400-e29b-41d4-a716-446655440003',
  }),
  inspectionId: z.string().uuid().openapi({
    description: 'Associated inspection ID',
  }),
  format: z.string().openapi({
    description: 'Report format',
    example: 'pdf',
  }),
  path: z.string().openapi({
    description: 'Storage path to the report file',
    example: '/reports/inspection-abc123.pdf',
  }),
  url: z.string().url().optional().openapi({
    description: 'Download URL (if available)',
    example: 'https://storage.example.com/reports/inspection-abc123.pdf',
  }),
  createdAt: z.string().datetime().openapi({
    description: 'Generation timestamp',
  }),
}).openapi('ReportResponse');

export const ReportListResponseSchema = z.array(ReportResponseSchema).openapi('ReportListResponse');

export const ReportGenerationStatusSchema = z.object({
  status: z.enum(['pending', 'processing', 'completed', 'failed']).openapi({
    description: 'Current generation status',
    example: 'completed',
  }),
  report: ReportResponseSchema.optional().openapi({
    description: 'Report details if completed',
  }),
  error: z.string().optional().openapi({
    description: 'Error message if failed',
  }),
}).openapi('ReportGenerationStatus');

// ============================================
// Register Schemas
// ============================================

registry.register('GenerateReportRequest', GenerateReportSchema);
registry.register('ReportResponse', ReportResponseSchema);
registry.register('ReportListResponse', ReportListResponseSchema);
registry.register('ReportGenerationStatus', ReportGenerationStatusSchema);

// ============================================
// Register Routes
// ============================================

registry.registerPath({
  method: 'post',
  path: '/api/inspections/{inspectionId}/reports',
  tags: ['Reports'],
  summary: 'Generate a report for an inspection',
  description: 'Generates a PDF or DOCX report for the specified inspection',
  request: {
    params: z.object({
      inspectionId: z.string().uuid().openapi({
        description: 'Inspection ID',
      }),
    }),
    body: {
      content: {
        'application/json': {
          schema: GenerateReportSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Report generated successfully',
      content: {
        'application/json': {
          schema: ReportResponseSchema,
        },
      },
    },
    400: {
      description: 'Invalid request',
    },
    404: {
      description: 'Inspection not found',
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/inspections/{inspectionId}/reports',
  tags: ['Reports'],
  summary: 'List reports for an inspection',
  request: {
    params: z.object({
      inspectionId: z.string().uuid().openapi({
        description: 'Inspection ID',
      }),
    }),
  },
  responses: {
    200: {
      description: 'List of reports',
      content: {
        'application/json': {
          schema: ReportListResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/reports/{id}',
  tags: ['Reports'],
  summary: 'Get report by ID',
  request: {
    params: z.object({
      id: z.string().uuid().openapi({
        description: 'Report ID',
      }),
    }),
  },
  responses: {
    200: {
      description: 'Report details',
      content: {
        'application/json': {
          schema: ReportResponseSchema,
        },
      },
    },
    404: {
      description: 'Report not found',
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/reports/{id}/download',
  tags: ['Reports'],
  summary: 'Download report file',
  request: {
    params: z.object({
      id: z.string().uuid().openapi({
        description: 'Report ID',
      }),
    }),
  },
  responses: {
    200: {
      description: 'Report file',
      content: {
        'application/pdf': {
          schema: z.any().openapi({
            type: 'string',
            format: 'binary',
          }),
        },
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
          schema: z.any().openapi({
            type: 'string',
            format: 'binary',
          }),
        },
      },
    },
    404: {
      description: 'Report not found',
    },
  },
});
