/**
 * OpenAPI Route Registration for Defects
 * Issue #497
 */

import { z } from '../setup.js';
import { registry } from '../registry.js';
import { ErrorResponseSchema } from '../schemas/common.js';
import { BadRequestErrorSchema } from '../schemas/errors.js';

// ============================================
// Schemas
// ============================================

const BuildingElementEnum = z.enum([
  'ROOF', 'WALL', 'WINDOW', 'DOOR', 'DECK', 'BALCONY',
  'CLADDING', 'FOUNDATION', 'FLOOR', 'CEILING', 'PLUMBING',
  'ELECTRICAL', 'INSULATION', 'DRAINAGE', 'STRUCTURE', 'OTHER',
]);

const DefectPriorityEnum = z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']);

const CreateDefectSchema = z.object({
  location: z.string().min(1).openapi({
    description: 'Location of the defect',
    example: 'North-facing exterior wall',
  }),
  element: BuildingElementEnum.openapi({
    description: 'Building element affected',
    example: 'CLADDING',
  }),
  description: z.string().min(1).openapi({
    description: 'Description of the defect',
    example: 'Cracked weatherboard with visible moisture ingress',
  }),
  cause: z.string().optional().openapi({
    description: 'Suspected cause of the defect',
    example: 'Failed sealant around window junction',
  }),
  remedialAction: z.string().optional().openapi({
    description: 'Recommended remedial action',
    example: 'Replace affected weatherboards and reseal window junction',
  }),
  priority: DefectPriorityEnum.default('MEDIUM').openapi({
    description: 'Priority level',
    example: 'HIGH',
  }),
  linkedClauseId: z.string().uuid().optional().openapi({
    description: 'ID of linked building code clause',
  }),
  photoIds: z.array(z.string().uuid()).default([]).openapi({
    description: 'IDs of associated photos',
  }),
  sortOrder: z.number().int().default(0).openapi({
    description: 'Sort order for display',
    example: 1,
  }),
}).openapi('CreateDefectRequest');

const UpdateDefectSchema = z.object({
  location: z.string().min(1).optional(),
  element: BuildingElementEnum.optional(),
  description: z.string().min(1).optional(),
  cause: z.string().nullable().optional(),
  remedialAction: z.string().nullable().optional(),
  priority: DefectPriorityEnum.optional(),
  linkedClauseId: z.string().uuid().nullable().optional(),
  photoIds: z.array(z.string().uuid()).optional(),
  sortOrder: z.number().int().optional(),
}).openapi('UpdateDefectRequest');

const DefectResponseSchema = z.object({
  id: z.string().uuid(),
  inspectionId: z.string().uuid(),
  location: z.string(),
  element: BuildingElementEnum,
  description: z.string(),
  cause: z.string().nullable(),
  remedialAction: z.string().nullable(),
  priority: DefectPriorityEnum,
  linkedClauseId: z.string().uuid().nullable(),
  photoIds: z.array(z.string().uuid()),
  sortOrder: z.number().int(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).openapi('DefectResponse');

const DefectListResponseSchema = z.array(DefectResponseSchema).openapi('DefectListResponse');

// ============================================
// Routes
// ============================================

// POST /api/site-inspections/:inspectionId/defects - Create defect
registry.registerPath({
  method: 'post',
  path: '/api/site-inspections/{inspectionId}/defects',
  summary: 'Create a defect for an inspection',
  tags: ['Defects'],
  request: {
    params: z.object({
      inspectionId: z.string().uuid().openapi({ description: 'Site inspection ID' }),
    }),
    body: {
      content: {
        'application/json': { schema: CreateDefectSchema },
      },
    },
  },
  responses: {
    201: {
      description: 'Defect created',
      content: {
        'application/json': { schema: DefectResponseSchema },
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

// GET /api/site-inspections/:inspectionId/defects - List defects for inspection
registry.registerPath({
  method: 'get',
  path: '/api/site-inspections/{inspectionId}/defects',
  summary: 'List defects for an inspection',
  tags: ['Defects'],
  request: {
    params: z.object({
      inspectionId: z.string().uuid().openapi({ description: 'Site inspection ID' }),
    }),
  },
  responses: {
    200: {
      description: 'List of defects',
      content: {
        'application/json': { schema: DefectListResponseSchema },
      },
    },
    400: {
      description: 'Invalid inspection ID',
      content: {
        'application/json': { schema: BadRequestErrorSchema },
      },
    },
  },
});

// GET /api/defects/:id - Get defect by ID
registry.registerPath({
  method: 'get',
  path: '/api/defects/{id}',
  summary: 'Get a defect by ID',
  tags: ['Defects'],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: 'Defect ID' }),
    }),
  },
  responses: {
    200: {
      description: 'Defect details',
      content: {
        'application/json': { schema: DefectResponseSchema },
      },
    },
    400: {
      description: 'Invalid ID format',
      content: {
        'application/json': { schema: BadRequestErrorSchema },
      },
    },
    404: {
      description: 'Defect not found',
      content: {
        'application/json': { schema: ErrorResponseSchema },
      },
    },
  },
});

// PUT /api/defects/:id - Update defect
registry.registerPath({
  method: 'put',
  path: '/api/defects/{id}',
  summary: 'Update a defect',
  tags: ['Defects'],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: 'Defect ID' }),
    }),
    body: {
      content: {
        'application/json': { schema: UpdateDefectSchema },
      },
    },
  },
  responses: {
    200: {
      description: 'Defect updated',
      content: {
        'application/json': { schema: DefectResponseSchema },
      },
    },
    400: {
      description: 'Validation error',
      content: {
        'application/json': { schema: BadRequestErrorSchema },
      },
    },
    404: {
      description: 'Defect not found',
      content: {
        'application/json': { schema: ErrorResponseSchema },
      },
    },
  },
});

// DELETE /api/defects/:id - Delete defect
registry.registerPath({
  method: 'delete',
  path: '/api/defects/{id}',
  summary: 'Delete a defect',
  tags: ['Defects'],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: 'Defect ID' }),
    }),
  },
  responses: {
    204: {
      description: 'Defect deleted',
    },
    400: {
      description: 'Invalid ID format',
      content: {
        'application/json': { schema: BadRequestErrorSchema },
      },
    },
    404: {
      description: 'Defect not found',
      content: {
        'application/json': { schema: ErrorResponseSchema },
      },
    },
  },
});
