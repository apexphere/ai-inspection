/**
 * OpenAPI Route Registration for Building Code
 * Issue #431
 */

import { z } from '../setup.js';
import { registry } from '../registry.js';
import { ErrorResponseSchema } from '../schemas/common.js';

// ============================================
// Enums
// ============================================

const ClauseCategorySchema = z.enum(['B', 'C', 'D', 'E', 'F', 'G', 'H']).openapi({
  description: 'Building code clause category',
  example: 'E',
});

const DurabilityPeriodSchema = z.enum(['FIFTY_YEARS', 'FIFTEEN_YEARS', 'FIVE_YEARS', 'NA']).openapi({
  description: 'Durability period for the clause',
  example: 'FIFTEEN_YEARS',
});

// ============================================
// Schemas
// ============================================

const CreateClauseSchema = z.object({
  code: z.string().min(1).openapi({
    description: 'Unique clause code',
    example: 'E2.3.1',
  }),
  title: z.string().min(1).openapi({
    description: 'Clause title',
    example: 'External moisture',
  }),
  category: ClauseCategorySchema,
  objective: z.string().optional(),
  functionalReq: z.string().optional(),
  performanceText: z.string().min(1).openapi({
    description: 'Performance criteria text',
    example: 'Buildings must be constructed to prevent moisture penetration...',
  }),
  durabilityPeriod: DurabilityPeriodSchema.optional(),
  typicalEvidence: z.array(z.string()).optional().openapi({
    description: 'List of typical evidence items',
    example: ['Visual inspection', 'Moisture readings'],
  }),
  sortOrder: z.number().int().optional(),
  parentId: z.string().uuid().optional(),
}).openapi('CreateClauseRequest');

const UpdateClauseSchema = z.object({
  code: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  category: ClauseCategorySchema.optional(),
  objective: z.string().optional(),
  functionalReq: z.string().optional(),
  performanceText: z.string().min(1).optional(),
  durabilityPeriod: DurabilityPeriodSchema.optional(),
  typicalEvidence: z.array(z.string()).optional(),
  sortOrder: z.number().int().optional(),
  parentId: z.string().uuid().nullable().optional(),
}).openapi('UpdateClauseRequest');

const ClauseResponseSchema = z.object({
  id: z.string().uuid(),
  code: z.string().openapi({ example: 'E2.3.1' }),
  title: z.string().openapi({ example: 'External moisture' }),
  category: ClauseCategorySchema,
  objective: z.string().nullable(),
  functionalReq: z.string().nullable(),
  performanceText: z.string(),
  durabilityPeriod: DurabilityPeriodSchema.nullable(),
  typicalEvidence: z.array(z.string()),
  sortOrder: z.number().int(),
  parentId: z.string().uuid().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).openapi('ClauseResponse');

const ClauseListResponseSchema = z.array(ClauseResponseSchema).openapi('ClauseListResponse');

// Register schemas
registry.register('ClauseCategory', ClauseCategorySchema);
registry.register('DurabilityPeriod', DurabilityPeriodSchema);
registry.register('CreateClauseRequest', CreateClauseSchema);
registry.register('UpdateClauseRequest', UpdateClauseSchema);
registry.register('ClauseResponse', ClauseResponseSchema);
registry.register('ClauseListResponse', ClauseListResponseSchema);

// ============================================
// Routes
// ============================================

// GET /api/building-code/clauses - List clauses
registry.registerPath({
  method: 'get',
  path: '/api/building-code/clauses',
  summary: 'List building code clauses',
  description: 'Retrieve NZ Building Code clauses with optional filters.',
  tags: ['Building Code'],
  request: {
    query: z.object({
      category: ClauseCategorySchema.optional().openapi({ description: 'Filter by category' }),
      keyword: z.string().optional().openapi({ description: 'Search in code/title' }),
      parentId: z.string().optional().openapi({ description: 'Filter by parent ID' }),
      topLevel: z.string().optional().openapi({ description: 'Set to "true" for top-level only' }),
    }),
  },
  responses: {
    200: {
      description: 'List of clauses',
      content: {
        'application/json': { schema: ClauseListResponseSchema },
      },
    },
  },
});

// GET /api/building-code/clauses/hierarchy - Get hierarchy
registry.registerPath({
  method: 'get',
  path: '/api/building-code/clauses/hierarchy',
  summary: 'Get clauses grouped by category',
  description: 'Returns clauses organized in a hierarchical structure by category.',
  tags: ['Building Code'],
  responses: {
    200: {
      description: 'Clauses grouped by category',
      content: {
        'application/json': {
          schema: z.record(ClauseCategorySchema, ClauseListResponseSchema),
        },
      },
    },
  },
});

// GET /api/building-code/clauses/:code - Get by code
registry.registerPath({
  method: 'get',
  path: '/api/building-code/clauses/{code}',
  summary: 'Get clause by code',
  tags: ['Building Code'],
  request: {
    params: z.object({
      code: z.string().openapi({ description: 'Clause code (e.g., E2.3.1)', example: 'E2.3.1' }),
    }),
  },
  responses: {
    200: {
      description: 'Clause details',
      content: {
        'application/json': { schema: ClauseResponseSchema },
      },
    },
    404: {
      description: 'Clause not found',
      content: {
        'application/json': { schema: ErrorResponseSchema },
      },
    },
  },
});

// POST /api/building-code/clauses - Create clause (admin)
registry.registerPath({
  method: 'post',
  path: '/api/building-code/clauses',
  summary: 'Create a new clause (admin only)',
  tags: ['Building Code'],
  request: {
    body: {
      content: {
        'application/json': { schema: CreateClauseSchema },
      },
    },
  },
  responses: {
    201: {
      description: 'Clause created',
      content: {
        'application/json': { schema: ClauseResponseSchema },
      },
    },
    400: {
      description: 'Validation error',
      content: {
        'application/json': { schema: ErrorResponseSchema },
      },
    },
    403: {
      description: 'Admin access required',
      content: {
        'application/json': { schema: ErrorResponseSchema },
      },
    },
  },
});

// PUT /api/building-code/clauses/:id - Update clause (admin)
registry.registerPath({
  method: 'put',
  path: '/api/building-code/clauses/{id}',
  summary: 'Update a clause (admin only)',
  tags: ['Building Code'],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: 'Clause ID' }),
    }),
    body: {
      content: {
        'application/json': { schema: UpdateClauseSchema },
      },
    },
  },
  responses: {
    200: {
      description: 'Clause updated',
      content: {
        'application/json': { schema: ClauseResponseSchema },
      },
    },
    404: {
      description: 'Clause not found',
      content: {
        'application/json': { schema: ErrorResponseSchema },
      },
    },
  },
});

// DELETE /api/building-code/clauses/:id - Delete clause (admin)
registry.registerPath({
  method: 'delete',
  path: '/api/building-code/clauses/{id}',
  summary: 'Delete a clause (admin only)',
  tags: ['Building Code'],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: 'Clause ID' }),
    }),
  },
  responses: {
    204: {
      description: 'Clause deleted',
    },
    404: {
      description: 'Clause not found',
      content: {
        'application/json': { schema: ErrorResponseSchema },
      },
    },
  },
});
