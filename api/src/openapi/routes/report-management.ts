/**
 * OpenAPI Route Registration for Report Management
 * Issue #497
 */

import { z } from '../setup.js';
import { registry } from '../registry.js';
import { ErrorResponseSchema } from '../schemas/common.js';
import { BadRequestErrorSchema } from '../schemas/errors.js';

// ============================================
// Schemas
// ============================================

const ReportTypeEnum = z.enum(['COA', 'CCC_GAP', 'PPI', 'SAFE_SANITARY', 'TFA']);
const ReportStatusEnum = z.enum(['DRAFT', 'IN_REVIEW', 'APPROVED', 'FINALIZED', 'SUBMITTED']);

const CreateReportSchema = z.object({
  siteInspectionId: z.string().uuid().openapi({
    description: 'ID of the site inspection',
  }),
  type: ReportTypeEnum.openapi({
    description: 'Report type',
    example: 'COA',
  }),
  preparedById: z.string().min(1).openapi({
    description: 'ID of personnel who prepared the report',
  }),
  reviewedById: z.string().optional().openapi({
    description: 'ID of personnel who reviewed the report',
  }),
}).openapi('CreateReportRequest');

const UpdateReportSchema = z.object({
  status: ReportStatusEnum.optional(),
  preparedById: z.string().optional(),
  reviewedById: z.string().optional(),
  form9Data: z.record(z.unknown()).optional(),
}).openapi('UpdateReportManagementRequest');

const ReportResponseSchema = z.object({
  id: z.string().uuid(),
  siteInspectionId: z.string().uuid(),
  type: ReportTypeEnum,
  status: ReportStatusEnum,
  preparedById: z.string().nullable(),
  reviewedById: z.string().nullable(),
  reviewedAt: z.string().datetime().nullable(),
  form9Data: z.record(z.unknown()).nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).openapi('ReportManagementResponse');

const ReportListSchema = z.array(ReportResponseSchema).openapi('ReportManagementList');

const ApproveRequestSchema = z.object({
  reviewedById: z.string().uuid().openapi({
    description: 'ID of reviewer approving the report',
  }),
}).openapi('ApproveReportRequest');

const ValidationResultSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(z.string()),
  warnings: z.array(z.string()),
}).openapi('ValidationResult');

const SignatureBlockSchema = z.object({
  author: z.object({
    name: z.string(),
    credentials: z.string(),
    signatureLine: z.string(),
  }),
  reviewer: z.object({
    name: z.string(),
    credentials: z.string(),
    signatureLine: z.string(),
  }).nullable(),
  companyName: z.string(),
  date: z.string(),
}).openapi('SignatureBlock');

const Form9DataSchema = z.object({
  buildingName: z.string().nullable(),
  address: z.string(),
  legalDescription: z.string().nullable(),
  buildingConsent: z.string().nullable(),
  territorialAuthority: z.string().nullable(),
  inspectionDate: z.string().nullable(),
  preparedBy: z.object({
    name: z.string(),
    credentials: z.string(),
  }).nullable(),
  reviewedBy: z.object({
    name: z.string(),
    credentials: z.string(),
  }).nullable(),
}).openapi('Form9Data');

// ============================================
// Routes
// ============================================

// POST /api/reports - Create report
registry.registerPath({
  method: 'post',
  path: '/api/reports',
  summary: 'Create a new report',
  tags: ['Report Management'],
  request: {
    body: {
      content: {
        'application/json': { schema: CreateReportSchema },
      },
    },
  },
  responses: {
    201: {
      description: 'Report created',
      content: {
        'application/json': { schema: ReportResponseSchema },
      },
    },
    400: {
      description: 'Validation error',
      content: {
        'application/json': { schema: BadRequestErrorSchema },
      },
    },
  },
});

// GET /api/reports - List reports
registry.registerPath({
  method: 'get',
  path: '/api/reports',
  summary: 'List reports',
  description: 'List reports with optional filters',
  tags: ['Report Management'],
  request: {
    query: z.object({
      siteInspectionId: z.string().uuid().optional().openapi({ description: 'Filter by site inspection ID' }),
      type: ReportTypeEnum.optional().openapi({ description: 'Filter by report type' }),
      status: ReportStatusEnum.optional().openapi({ description: 'Filter by status' }),
      preparedById: z.string().optional().openapi({ description: 'Filter by preparer ID' }),
    }),
  },
  responses: {
    200: {
      description: 'List of reports',
      content: {
        'application/json': { schema: ReportListSchema },
      },
    },
  },
});

// GET /api/reports/:id/validate - Validate report
registry.registerPath({
  method: 'get',
  path: '/api/reports/{id}/validate',
  summary: 'Validate report for generation readiness',
  tags: ['Report Management'],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: 'Report ID' }),
    }),
  },
  responses: {
    200: {
      description: 'Validation result',
      content: {
        'application/json': { schema: ValidationResultSchema },
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

// GET /api/reports/:id - Get report by ID
registry.registerPath({
  method: 'get',
  path: '/api/reports/{id}',
  summary: 'Get report by ID',
  tags: ['Report Management'],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: 'Report ID' }),
    }),
  },
  responses: {
    200: {
      description: 'Report details',
      content: {
        'application/json': { schema: ReportResponseSchema },
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

// PUT /api/reports/:id - Update report
registry.registerPath({
  method: 'put',
  path: '/api/reports/{id}',
  summary: 'Update a report',
  tags: ['Report Management'],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: 'Report ID' }),
    }),
    body: {
      content: {
        'application/json': { schema: UpdateReportSchema },
      },
    },
  },
  responses: {
    200: {
      description: 'Report updated',
      content: {
        'application/json': { schema: ReportResponseSchema },
      },
    },
    400: {
      description: 'Invalid status transition or validation error',
      content: {
        'application/json': { schema: BadRequestErrorSchema },
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

// DELETE /api/reports/:id - Delete report
registry.registerPath({
  method: 'delete',
  path: '/api/reports/{id}',
  summary: 'Delete a report',
  tags: ['Report Management'],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: 'Report ID' }),
    }),
  },
  responses: {
    204: {
      description: 'Report deleted',
    },
    404: {
      description: 'Report not found',
      content: {
        'application/json': { schema: ErrorResponseSchema },
      },
    },
  },
});

// POST /api/reports/:id/review - Submit for review
registry.registerPath({
  method: 'post',
  path: '/api/reports/{id}/review',
  summary: 'Submit report for review',
  tags: ['Report Management'],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: 'Report ID' }),
    }),
  },
  responses: {
    200: {
      description: 'Report submitted for review',
      content: {
        'application/json': { schema: ReportResponseSchema },
      },
    },
    400: {
      description: 'Invalid status transition',
      content: {
        'application/json': { schema: BadRequestErrorSchema },
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

// POST /api/reports/:id/approve - Approve report
registry.registerPath({
  method: 'post',
  path: '/api/reports/{id}/approve',
  summary: 'Approve a report',
  tags: ['Report Management'],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: 'Report ID' }),
    }),
    body: {
      content: {
        'application/json': { schema: ApproveRequestSchema },
      },
    },
  },
  responses: {
    200: {
      description: 'Report approved',
      content: {
        'application/json': { schema: ReportResponseSchema },
      },
    },
    400: {
      description: 'Invalid status transition or missing reviewedById',
      content: {
        'application/json': { schema: BadRequestErrorSchema },
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

// GET /api/reports/:id/signature-block - Generate signature block
registry.registerPath({
  method: 'get',
  path: '/api/reports/{id}/signature-block',
  summary: 'Generate signature block',
  description: 'Generate a signature block with author and reviewer credentials',
  tags: ['Report Management'],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: 'Report ID' }),
    }),
  },
  responses: {
    200: {
      description: 'Signature block',
      content: {
        'application/json': { schema: SignatureBlockSchema },
      },
    },
    400: {
      description: 'Report has no author',
      content: {
        'application/json': { schema: BadRequestErrorSchema },
      },
    },
    404: {
      description: 'Report or personnel not found',
      content: {
        'application/json': { schema: ErrorResponseSchema },
      },
    },
  },
});

// GET /api/reports/:id/form9 - Export Form 9 data
registry.registerPath({
  method: 'get',
  path: '/api/reports/{id}/form9',
  summary: 'Export Form 9 data',
  description: 'Extract Form 9 data for the report',
  tags: ['Report Management'],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: 'Report ID' }),
    }),
  },
  responses: {
    200: {
      description: 'Form 9 data',
      content: {
        'application/json': { schema: Form9DataSchema },
      },
    },
    400: {
      description: 'Inspection not linked to report',
      content: {
        'application/json': { schema: BadRequestErrorSchema },
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
