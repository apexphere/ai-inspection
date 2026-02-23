/**
 * OpenAPI Schemas for Building Code Endpoints
 * Issue #431
 */

import { z } from '../setup.js';
import { registry } from '../registry.js';

// ============================================
// Enums
// ============================================

export const ClauseCategorySchema = z.enum(['B', 'C', 'D', 'E', 'F', 'G', 'H']).openapi({
  description: 'Building code clause category',
  example: 'E',
});

export const DurabilityPeriodSchema = z.enum(['FIFTY_YEARS', 'FIFTEEN_YEARS', 'FIVE_YEARS', 'NA']).openapi({
  description: 'Durability period for the clause',
  example: 'FIFTEEN_YEARS',
});

// ============================================
// Request Schemas
// ============================================

export const CreateClauseSchema = z.object({
  code: z.string().min(1).openapi({
    description: 'Unique clause code',
    example: 'E2.3.1',
  }),
  title: z.string().min(1).openapi({
    description: 'Clause title',
    example: 'External moisture',
  }),
  category: ClauseCategorySchema,
  objective: z.string().optional().openapi({
    description: 'Clause objective',
  }),
  functionalReq: z.string().optional().openapi({
    description: 'Functional requirement',
  }),
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
  parentId: z.string().uuid().optional().openapi({
    description: 'Parent clause ID for hierarchy',
  }),
}).openapi('CreateClauseRequest');

export const UpdateClauseSchema = z.object({
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

// ============================================
// Response Schemas
// ============================================

export const ClauseResponseSchema = z.object({
  id: z.string().uuid().openapi({
    description: 'Clause ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  }),
  code: z.string().openapi({
    description: 'Clause code',
    example: 'E2.3.1',
  }),
  title: z.string().openapi({
    description: 'Clause title',
    example: 'External moisture',
  }),
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

export const ClauseListResponseSchema = z.array(ClauseResponseSchema).openapi('ClauseListResponse');

export const ClauseHierarchyResponseSchema = z.record(
  ClauseCategorySchema,
  z.array(ClauseResponseSchema)
).openapi('ClauseHierarchyResponse');

// ============================================
// Register Schemas
// ============================================

registry.register('ClauseCategory', ClauseCategorySchema);
registry.register('DurabilityPeriod', DurabilityPeriodSchema);
registry.register('CreateClauseRequest', CreateClauseSchema);
registry.register('UpdateClauseRequest', UpdateClauseSchema);
registry.register('ClauseResponse', ClauseResponseSchema);
registry.register('ClauseListResponse', ClauseListResponseSchema);
registry.register('ClauseHierarchyResponse', ClauseHierarchyResponseSchema);

// ============================================
// Register Routes
// ============================================

registry.registerPath({
  method: 'get',
  path: '/api/building-code/clauses',
  tags: ['Building Code'],
  summary: 'List building code clauses',
  request: {
    query: z.object({
      category: ClauseCategorySchema.optional().openapi({ description: 'Filter by category' }),
      keyword: z.string().optional().openapi({ description: 'Search in code/title' }),
      parentId: z.string().optional().openapi({ description: 'Filter by parent ID' }),
      topLevel: z.string().optional().openapi({ description: 'Set to "true" to get only top-level clauses' }),
    }),
  },
  responses: {
    200: {
      description: 'List of clauses',
      content: {
        'application/json': {
          schema: ClauseListResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/building-code/clauses/hierarchy',
  tags: ['Building Code'],
  summary: 'Get clauses grouped by category',
  responses: {
    200: {
      description: 'Clauses grouped by category',
      content: {
        'application/json': {
          schema: ClauseHierarchyResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/building-code/clauses/{code}',
  tags: ['Building Code'],
  summary: 'Get clause by code',
  request: {
    params: z.object({
      code: z.string().openapi({ description: 'Clause code (e.g., E2.3.1)' }),
    }),
  },
  responses: {
    200: {
      description: 'Clause details',
      content: {
        'application/json': {
          schema: ClauseResponseSchema,
        },
      },
    },
    404: {
      description: 'Clause not found',
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/building-code/clauses',
  tags: ['Building Code'],
  summary: 'Create a new clause (admin only)',
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateClauseSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Clause created',
      content: {
        'application/json': {
          schema: ClauseResponseSchema,
        },
      },
    },
    400: {
      description: 'Validation error',
    },
    403: {
      description: 'Admin access required',
    },
  },
});

registry.registerPath({
  method: 'put',
  path: '/api/building-code/clauses/{id}',
  tags: ['Building Code'],
  summary: 'Update a clause (admin only)',
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: 'Clause ID' }),
    }),
    body: {
      content: {
        'application/json': {
          schema: UpdateClauseSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Clause updated',
      content: {
        'application/json': {
          schema: ClauseResponseSchema,
        },
      },
    },
    404: {
      description: 'Clause not found',
    },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/building-code/clauses/{id}',
  tags: ['Building Code'],
  summary: 'Delete a clause (admin only)',
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
    },
  },
});
