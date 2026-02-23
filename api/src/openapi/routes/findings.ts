/**
 * OpenAPI Route Registration for Findings
 * Issue #431
 */

import { z } from '../setup.js';
import { registry } from '../registry.js';
import {
  CreateFindingSchema,
  UpdateFindingSchema,
  FindingResponseSchema,
  FindingListResponseSchema,
} from '../schemas/finding.js';
import { ValidationErrorSchema, NotFoundErrorSchema } from '../schemas/inspection.js';
import { ErrorResponseSchema } from '../schemas/common.js';

// Path parameter schema
const FindingIdParam = z.object({
  id: z.string().uuid().openapi({ description: 'Finding ID' }),
});

// Query parameter schema
const FindingsQuerySchema = z.object({
  inspectionId: z.string().uuid().optional().openapi({ description: 'Filter by inspection ID' }),
});

// POST /api/findings - Create finding
registry.registerPath({
  method: 'post',
  path: '/api/findings',
  summary: 'Create a new finding',
  description: 'Add a finding to an inspection.',
  tags: ['Findings'],
  request: {
    body: {
      content: {
        'application/json': { schema: CreateFindingSchema },
      },
      required: true,
    },
  },
  responses: {
    201: {
      description: 'Finding created successfully',
      content: {
        'application/json': { schema: FindingResponseSchema },
      },
    },
    400: {
      description: 'Validation error',
      content: {
        'application/json': { schema: ValidationErrorSchema },
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

// GET /api/findings - List findings
registry.registerPath({
  method: 'get',
  path: '/api/findings',
  summary: 'List findings',
  description: 'Retrieve findings, optionally filtered by inspection.',
  tags: ['Findings'],
  request: {
    query: FindingsQuerySchema,
  },
  responses: {
    200: {
      description: 'List of findings',
      content: {
        'application/json': { schema: FindingListResponseSchema },
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

// GET /api/findings/:id - Get finding by ID
registry.registerPath({
  method: 'get',
  path: '/api/findings/{id}',
  summary: 'Get finding by ID',
  description: 'Retrieve a specific finding.',
  tags: ['Findings'],
  request: {
    params: FindingIdParam,
  },
  responses: {
    200: {
      description: 'Finding details',
      content: {
        'application/json': { schema: FindingResponseSchema },
      },
    },
    404: {
      description: 'Finding not found',
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

// PUT /api/findings/:id - Update finding
registry.registerPath({
  method: 'put',
  path: '/api/findings/{id}',
  summary: 'Update finding',
  description: 'Update an existing finding.',
  tags: ['Findings'],
  request: {
    params: FindingIdParam,
    body: {
      content: {
        'application/json': { schema: UpdateFindingSchema },
      },
      required: true,
    },
  },
  responses: {
    200: {
      description: 'Finding updated successfully',
      content: {
        'application/json': { schema: FindingResponseSchema },
      },
    },
    400: {
      description: 'Validation error',
      content: {
        'application/json': { schema: ValidationErrorSchema },
      },
    },
    404: {
      description: 'Finding not found',
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

// DELETE /api/findings/:id - Delete finding
registry.registerPath({
  method: 'delete',
  path: '/api/findings/{id}',
  summary: 'Delete finding',
  description: 'Delete an existing finding.',
  tags: ['Findings'],
  request: {
    params: FindingIdParam,
  },
  responses: {
    204: {
      description: 'Finding deleted successfully',
    },
    404: {
      description: 'Finding not found',
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
