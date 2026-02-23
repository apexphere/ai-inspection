/**
 * OpenAPI Schemas for Finding Endpoints
 * Issue #429
 */

import { z } from '../setup.js';
import { registry } from '../registry.js';

// ============================================
// Enums
// ============================================

export const SeveritySchema = z.enum(['INFO', 'MINOR', 'MAJOR', 'URGENT']).openapi({
  description: 'Severity level of the finding',
  example: 'MAJOR',
});

// ============================================
// Request Schemas
// ============================================

export const CreateFindingSchema = z.object({
  inspectionId: z.string().uuid().openapi({
    description: 'ID of the inspection this finding belongs to',
    example: '550e8400-e29b-41d4-a716-446655440000',
  }),
  section: z.string().min(1).openapi({
    description: 'Section of the inspection where finding was observed',
    example: 'exterior',
  }),
  text: z.string().min(1).openapi({
    description: 'Description of the finding',
    example: 'Cracked weatherboard on north wall',
  }),
  severity: SeveritySchema.default('INFO'),
  matchedComment: z.string().optional().openapi({
    description: 'Matched template comment if any',
  }),
}).openapi('CreateFindingRequest');

export const UpdateFindingSchema = z.object({
  section: z.string().min(1).optional().openapi({
    description: 'Updated section',
  }),
  text: z.string().min(1).optional().openapi({
    description: 'Updated finding text',
  }),
  severity: SeveritySchema.optional(),
  matchedComment: z.string().optional().openapi({
    description: 'Updated matched comment',
  }),
}).openapi('UpdateFindingRequest');

// ============================================
// Response Schemas
// ============================================

export const PhotoSummarySchema = z.object({
  id: z.string().uuid().openapi({
    description: 'Photo ID',
  }),
  filename: z.string().openapi({
    description: 'Original filename',
    example: 'IMG_001.jpg',
  }),
  path: z.string().openapi({
    description: 'Storage path',
  }),
  mimeType: z.string().openapi({
    description: 'MIME type',
    example: 'image/jpeg',
  }),
}).openapi('PhotoSummary');

export const FindingResponseSchema = z.object({
  id: z.string().uuid().openapi({
    description: 'Finding ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  }),
  inspectionId: z.string().uuid().openapi({
    description: 'Parent inspection ID',
  }),
  section: z.string().openapi({
    description: 'Inspection section',
    example: 'exterior',
  }),
  text: z.string().openapi({
    description: 'Finding description',
    example: 'Cracked weatherboard on north wall',
  }),
  severity: SeveritySchema,
  matchedComment: z.string().nullable().openapi({
    description: 'Matched template comment',
  }),
  createdAt: z.string().datetime().openapi({
    description: 'Creation timestamp',
  }),
  updatedAt: z.string().datetime().openapi({
    description: 'Last update timestamp',
  }),
  photos: z.array(PhotoSummarySchema).optional().openapi({
    description: 'Associated photos',
  }),
}).openapi('FindingResponse');

export const FindingListResponseSchema = z.array(FindingResponseSchema).openapi('FindingListResponse');

// ============================================
// Register Schemas
// ============================================

registry.register('Severity', SeveritySchema);
registry.register('CreateFindingRequest', CreateFindingSchema);
registry.register('UpdateFindingRequest', UpdateFindingSchema);
registry.register('PhotoSummary', PhotoSummarySchema);
registry.register('FindingResponse', FindingResponseSchema);
registry.register('FindingListResponse', FindingListResponseSchema);

// ============================================
// Register Routes
// ============================================

registry.registerPath({
  method: 'post',
  path: '/api/findings',
  tags: ['Findings'],
  summary: 'Create a new finding',
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateFindingSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Finding created successfully',
      content: {
        'application/json': {
          schema: FindingResponseSchema,
        },
      },
    },
    400: {
      description: 'Validation error',
      content: {
        'application/json': {
          schema: z.object({
            error: z.string(),
            details: z.record(z.array(z.string())).optional(),
          }),
        },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/inspections/{inspectionId}/findings',
  tags: ['Findings'],
  summary: 'List findings for an inspection',
  request: {
    params: z.object({
      inspectionId: z.string().uuid().openapi({
        description: 'Inspection ID',
      }),
    }),
  },
  responses: {
    200: {
      description: 'List of findings',
      content: {
        'application/json': {
          schema: FindingListResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/findings/{id}',
  tags: ['Findings'],
  summary: 'Get finding by ID',
  request: {
    params: z.object({
      id: z.string().uuid().openapi({
        description: 'Finding ID',
      }),
    }),
  },
  responses: {
    200: {
      description: 'Finding details',
      content: {
        'application/json': {
          schema: FindingResponseSchema,
        },
      },
    },
    404: {
      description: 'Finding not found',
    },
  },
});
