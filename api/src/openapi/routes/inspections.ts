/**
 * OpenAPI Route Registration for Inspections
 * Issue #431
 */

import { z } from '../setup.js';
import { registry } from '../registry.js';
import {
  CreateInspectionSchema,
  UpdateInspectionSchema,
  InspectionResponseSchema,
  InspectionListResponseSchema,
  ValidationErrorSchema,
  NotFoundErrorSchema,
} from '../schemas/inspection.js';
import { ErrorResponseSchema } from '../schemas/common.js';

// Path parameter schema
const InspectionIdParam = z.object({
  id: z.string().uuid().openapi({ description: 'Inspection ID' }),
});

// POST /api/inspections - Create inspection
registry.registerPath({
  method: 'post',
  path: '/api/inspections',
  summary: 'Create a new inspection',
  description: 'Start a new building inspection with the specified details.',
  tags: ['Inspections'],
  request: {
    body: {
      content: {
        'application/json': { schema: CreateInspectionSchema },
      },
      required: true,
    },
  },
  responses: {
    201: {
      description: 'Inspection created successfully',
      content: {
        'application/json': { schema: InspectionResponseSchema },
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

// GET /api/inspections - List all inspections
registry.registerPath({
  method: 'get',
  path: '/api/inspections',
  summary: 'List all inspections',
  description: 'Retrieve a list of all inspections.',
  tags: ['Inspections'],
  responses: {
    200: {
      description: 'List of inspections',
      content: {
        'application/json': { schema: InspectionListResponseSchema },
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

// GET /api/inspections/:id - Get inspection by ID
registry.registerPath({
  method: 'get',
  path: '/api/inspections/{id}',
  summary: 'Get inspection by ID',
  description: 'Retrieve a specific inspection by its ID.',
  tags: ['Inspections'],
  request: {
    params: InspectionIdParam,
  },
  responses: {
    200: {
      description: 'Inspection details',
      content: {
        'application/json': { schema: InspectionResponseSchema },
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

// PUT /api/inspections/:id - Update inspection
registry.registerPath({
  method: 'put',
  path: '/api/inspections/{id}',
  summary: 'Update inspection',
  description: 'Update an existing inspection.',
  tags: ['Inspections'],
  request: {
    params: InspectionIdParam,
    body: {
      content: {
        'application/json': { schema: UpdateInspectionSchema },
      },
      required: true,
    },
  },
  responses: {
    200: {
      description: 'Inspection updated successfully',
      content: {
        'application/json': { schema: InspectionResponseSchema },
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

// DELETE /api/inspections/:id - Delete inspection
registry.registerPath({
  method: 'delete',
  path: '/api/inspections/{id}',
  summary: 'Delete inspection',
  description: 'Delete an existing inspection.',
  tags: ['Inspections'],
  request: {
    params: InspectionIdParam,
  },
  responses: {
    204: {
      description: 'Inspection deleted successfully',
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
