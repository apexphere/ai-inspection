/**
 * OpenAPI Route Registration for Moisture Readings
 * Issue #497
 */

import { z } from '../setup.js';
import { registry } from '../registry.js';
import { ErrorResponseSchema } from '../schemas/common.js';
import { BadRequestErrorSchema } from '../schemas/errors.js';

// ============================================
// Schemas
// ============================================

const MoistureResultEnum = z.enum(['PENDING', 'ACCEPTABLE', 'MARGINAL', 'UNACCEPTABLE']);

const CreateMoistureReadingSchema = z.object({
  location: z.string().min(1).openapi({
    description: 'Location of reading',
    example: 'North wall, ground floor',
  }),
  substrate: z.string().optional().openapi({
    description: 'Substrate type',
    example: 'Timber framing',
  }),
  reading: z.number().min(0).max(100).openapi({
    description: 'Moisture reading percentage',
    example: 18.5,
  }),
  depth: z.number().positive().optional().openapi({
    description: 'Depth of reading in mm',
    example: 25,
  }),
  result: MoistureResultEnum.optional().openapi({
    description: 'Result classification',
    example: 'MARGINAL',
  }),
  defectId: z.string().uuid().optional().openapi({
    description: 'ID of linked defect',
  }),
  linkedClauseId: z.string().uuid().optional().openapi({
    description: 'ID of linked building code clause',
  }),
  notes: z.string().optional().openapi({
    description: 'Additional notes',
    example: 'Reading taken after rain event',
  }),
  takenAt: z.string().datetime().optional().openapi({
    description: 'When the reading was taken',
    example: '2026-02-25T10:30:00.000Z',
  }),
  sortOrder: z.number().int().optional().openapi({
    description: 'Sort order for display',
    example: 1,
  }),
}).openapi('CreateMoistureReadingRequest');

const UpdateMoistureReadingSchema = z.object({
  location: z.string().min(1).optional(),
  substrate: z.string().nullable().optional(),
  reading: z.number().min(0).max(100).optional(),
  depth: z.number().positive().nullable().optional(),
  result: MoistureResultEnum.optional(),
  defectId: z.string().uuid().nullable().optional(),
  linkedClauseId: z.string().uuid().nullable().optional(),
  notes: z.string().nullable().optional(),
  takenAt: z.string().datetime().nullable().optional(),
  sortOrder: z.number().int().optional(),
}).openapi('UpdateMoistureReadingRequest');

const MoistureReadingResponseSchema = z.object({
  id: z.string().uuid(),
  inspectionId: z.string().uuid(),
  location: z.string(),
  substrate: z.string().nullable(),
  reading: z.number(),
  depth: z.number().nullable(),
  result: MoistureResultEnum,
  defectId: z.string().uuid().nullable(),
  linkedClauseId: z.string().uuid().nullable(),
  notes: z.string().nullable(),
  takenAt: z.string().datetime().nullable(),
  sortOrder: z.number().int(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).openapi('MoistureReadingResponse');

const MoistureReadingListSchema = z.array(MoistureReadingResponseSchema).openapi('MoistureReadingList');

// ============================================
// Routes
// ============================================

// POST /api/inspections/:inspectionId/moisture-readings - Create reading
registry.registerPath({
  method: 'post',
  path: '/api/inspections/{inspectionId}/moisture-readings',
  summary: 'Create a moisture reading',
  tags: ['Moisture Readings'],
  request: {
    params: z.object({
      inspectionId: z.string().uuid().openapi({ description: 'Inspection ID' }),
    }),
    body: {
      content: {
        'application/json': { schema: CreateMoistureReadingSchema },
      },
    },
  },
  responses: {
    201: {
      description: 'Moisture reading created',
      content: {
        'application/json': { schema: MoistureReadingResponseSchema },
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

// GET /api/inspections/:inspectionId/moisture-readings - List readings
registry.registerPath({
  method: 'get',
  path: '/api/inspections/{inspectionId}/moisture-readings',
  summary: 'List moisture readings for an inspection',
  tags: ['Moisture Readings'],
  request: {
    params: z.object({
      inspectionId: z.string().uuid().openapi({ description: 'Inspection ID' }),
    }),
  },
  responses: {
    200: {
      description: 'List of moisture readings',
      content: {
        'application/json': { schema: MoistureReadingListSchema },
      },
    },
  },
});

// GET /api/moisture-readings/:id - Get reading by ID
registry.registerPath({
  method: 'get',
  path: '/api/moisture-readings/{id}',
  summary: 'Get a moisture reading by ID',
  tags: ['Moisture Readings'],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: 'Moisture reading ID' }),
    }),
  },
  responses: {
    200: {
      description: 'Moisture reading details',
      content: {
        'application/json': { schema: MoistureReadingResponseSchema },
      },
    },
    404: {
      description: 'Moisture reading not found',
      content: {
        'application/json': { schema: ErrorResponseSchema },
      },
    },
  },
});

// PUT /api/moisture-readings/:id - Update reading
registry.registerPath({
  method: 'put',
  path: '/api/moisture-readings/{id}',
  summary: 'Update a moisture reading',
  tags: ['Moisture Readings'],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: 'Moisture reading ID' }),
    }),
    body: {
      content: {
        'application/json': { schema: UpdateMoistureReadingSchema },
      },
    },
  },
  responses: {
    200: {
      description: 'Moisture reading updated',
      content: {
        'application/json': { schema: MoistureReadingResponseSchema },
      },
    },
    400: {
      description: 'Validation error',
      content: {
        'application/json': { schema: BadRequestErrorSchema },
      },
    },
    404: {
      description: 'Moisture reading not found',
      content: {
        'application/json': { schema: ErrorResponseSchema },
      },
    },
  },
});

// DELETE /api/moisture-readings/:id - Delete reading
registry.registerPath({
  method: 'delete',
  path: '/api/moisture-readings/{id}',
  summary: 'Delete a moisture reading',
  tags: ['Moisture Readings'],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: 'Moisture reading ID' }),
    }),
  },
  responses: {
    204: {
      description: 'Moisture reading deleted',
    },
    404: {
      description: 'Moisture reading not found',
      content: {
        'application/json': { schema: ErrorResponseSchema },
      },
    },
  },
});
