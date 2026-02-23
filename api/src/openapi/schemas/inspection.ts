/**
 * OpenAPI Schemas for Inspection Endpoints
 * Issue #429, #432
 */

import { z } from '../setup.js';
import { registry } from '../registry.js';
import { BadRequestErrorSchema, NotFoundErrorSchema } from './errors.js';

// ============================================
// Enums
// ============================================

export const InspectionStatusSchema = z.enum(['STARTED', 'IN_PROGRESS', 'COMPLETED']).openapi({
  description: 'Current status of the inspection',
  example: 'IN_PROGRESS',
});

// ============================================
// Request Schemas
// ============================================

export const CreateInspectionSchema = z.object({
  address: z.string().min(1).openapi({
    description: 'Property address being inspected',
    example: '42 Oak Street, Ponsonby, Auckland',
  }),
  clientName: z.string().min(1).openapi({
    description: 'Name of the client requesting the inspection',
    example: 'Sarah Johnson',
  }),
  inspectorName: z.string().optional().openapi({
    description: 'Name of the inspector conducting the inspection',
    example: 'Jake Li',
  }),
  checklistId: z.string().min(1).openapi({
    description: 'ID of the checklist template to use',
    example: 'nz-ppi',
  }),
  currentSection: z.string().default('exterior').openapi({
    description: 'Current section of the inspection',
    example: 'exterior',
  }),
  metadata: z.any().optional().openapi({
    description: 'Additional metadata for the inspection',
  }),
}).openapi('CreateInspectionRequest');

export const UpdateInspectionSchema = z.object({
  address: z.string().min(1).optional().openapi({
    description: 'Updated property address',
  }),
  clientName: z.string().min(1).optional().openapi({
    description: 'Updated client name',
  }),
  inspectorName: z.string().optional().openapi({
    description: 'Updated inspector name',
  }),
  status: InspectionStatusSchema.optional(),
  currentSection: z.string().optional().openapi({
    description: 'Current section of the inspection',
  }),
  metadata: z.any().optional().openapi({
    description: 'Additional metadata',
  }),
  completedAt: z.string().datetime().optional().openapi({
    description: 'Completion timestamp (ISO 8601)',
    example: '2026-02-23T14:30:00Z',
  }),
}).openapi('UpdateInspectionRequest');

// ============================================
// Response Schemas
// ============================================

export const InspectionResponseSchema = z.object({
  id: z.string().uuid().openapi({
    description: 'Unique identifier for the inspection',
    example: '550e8400-e29b-41d4-a716-446655440000',
  }),
  address: z.string().openapi({
    description: 'Property address',
    example: '42 Oak Street, Ponsonby, Auckland',
  }),
  clientName: z.string().openapi({
    description: 'Client name',
    example: 'Sarah Johnson',
  }),
  inspectorName: z.string().nullable().openapi({
    description: 'Inspector name',
    example: 'Jake Li',
  }),
  checklistId: z.string().openapi({
    description: 'Checklist template ID',
    example: 'nz-ppi',
  }),
  status: InspectionStatusSchema,
  currentSection: z.string().openapi({
    description: 'Current section',
    example: 'interior',
  }),
  metadata: z.any().nullable().openapi({
    description: 'Additional metadata',
  }),
  createdAt: z.string().datetime().openapi({
    description: 'Creation timestamp',
    example: '2026-02-23T09:00:00Z',
  }),
  updatedAt: z.string().datetime().openapi({
    description: 'Last update timestamp',
    example: '2026-02-23T11:30:00Z',
  }),
  completedAt: z.string().datetime().nullable().openapi({
    description: 'Completion timestamp',
    example: '2026-02-23T14:30:00Z',
  }),
}).openapi('InspectionResponse');

export const InspectionListResponseSchema = z.array(InspectionResponseSchema).openapi('InspectionListResponse');

// ============================================
// Register Schemas
// ============================================

registry.register('InspectionStatus', InspectionStatusSchema);
registry.register('CreateInspectionRequest', CreateInspectionSchema);
registry.register('UpdateInspectionRequest', UpdateInspectionSchema);
registry.register('InspectionResponse', InspectionResponseSchema);
registry.register('InspectionListResponse', InspectionListResponseSchema);

// ============================================
// Register Routes
// ============================================

registry.registerPath({
  method: 'post',
  path: '/api/inspections',
  tags: ['Inspections'],
  summary: 'Create a new inspection',
  description: 'Start a new property inspection with address, client info, and checklist.',
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateInspectionSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Inspection created successfully',
      content: {
        'application/json': {
          schema: InspectionResponseSchema,
        },
      },
    },
    400: {
      description: 'Validation error',
      content: {
        'application/json': {
          schema: BadRequestErrorSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/inspections',
  tags: ['Inspections'],
  summary: 'List all inspections',
  description: 'Retrieve all inspections, optionally filtered by status.',
  responses: {
    200: {
      description: 'List of inspections',
      content: {
        'application/json': {
          schema: InspectionListResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/inspections/{id}',
  tags: ['Inspections'],
  summary: 'Get inspection by ID',
  description: 'Retrieve details of a specific inspection.',
  request: {
    params: z.object({
      id: z.string().uuid().openapi({
        description: 'Inspection ID',
        example: '550e8400-e29b-41d4-a716-446655440000',
      }),
    }),
  },
  responses: {
    200: {
      description: 'Inspection details',
      content: {
        'application/json': {
          schema: InspectionResponseSchema,
        },
      },
    },
    404: {
      description: 'Inspection not found',
      content: {
        'application/json': {
          schema: NotFoundErrorSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'put',
  path: '/api/inspections/{id}',
  tags: ['Inspections'],
  summary: 'Update an inspection',
  description: 'Update inspection details, status, or mark as completed.',
  request: {
    params: z.object({
      id: z.string().uuid().openapi({
        description: 'Inspection ID',
      }),
    }),
    body: {
      content: {
        'application/json': {
          schema: UpdateInspectionSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Inspection updated',
      content: {
        'application/json': {
          schema: InspectionResponseSchema,
        },
      },
    },
    400: {
      description: 'Validation error',
      content: {
        'application/json': {
          schema: BadRequestErrorSchema,
        },
      },
    },
    404: {
      description: 'Inspection not found',
      content: {
        'application/json': {
          schema: NotFoundErrorSchema,
        },
      },
    },
  },
});
