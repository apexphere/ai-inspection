/**
 * OpenAPI Route Registration for Cost Estimates
 * Issue #497
 */

import { z } from '../setup.js';
import { registry } from '../registry.js';
import { ErrorResponseSchema } from '../schemas/common.js';
import { BadRequestErrorSchema, ConflictErrorSchema } from '../schemas/errors.js';

// ============================================
// Schemas
// ============================================

const CreateCostEstimateSchema = z.object({
  contingencyRate: z.number().min(0).max(1).optional().openapi({
    description: 'Contingency rate as decimal (0-1)',
    example: 0.15,
  }),
  notes: z.string().optional().openapi({
    description: 'Additional notes',
    example: 'Cost estimate for remedial works',
  }),
}).openapi('CreateCostEstimateRequest');

const UpdateCostEstimateSchema = z.object({
  contingencyRate: z.number().min(0).max(1).optional(),
  notes: z.string().nullable().optional(),
}).openapi('UpdateCostEstimateRequest');

const CostLineItemSchema = z.object({
  id: z.string().uuid(),
  costEstimateId: z.string().uuid(),
  category: z.string(),
  description: z.string(),
  quantity: z.number(),
  unit: z.string(),
  rate: z.number(),
  amount: z.number(),
  sortOrder: z.number().int(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).openapi('CostLineItem');

const CostEstimateResponseSchema = z.object({
  id: z.string().uuid(),
  reportId: z.string().uuid(),
  contingencyRate: z.number(),
  notes: z.string().nullable(),
  subtotal: z.number(),
  contingency: z.number(),
  total: z.number(),
  lineItems: z.array(CostLineItemSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).openapi('CostEstimateResponse');

const CreateCostLineItemSchema = z.object({
  category: z.string().min(1).openapi({
    description: 'Cost category',
    example: 'Remedial Works',
  }),
  description: z.string().min(1).openapi({
    description: 'Line item description',
    example: 'Replace damaged weatherboard',
  }),
  quantity: z.number().positive().openapi({
    description: 'Quantity',
    example: 10,
  }),
  unit: z.string().min(1).openapi({
    description: 'Unit of measure',
    example: 'm²',
  }),
  rate: z.number().min(0).openapi({
    description: 'Rate per unit',
    example: 150.0,
  }),
  sortOrder: z.number().int().optional().openapi({
    description: 'Sort order',
    example: 1,
  }),
}).openapi('CreateCostLineItemRequest');

const UpdateCostLineItemSchema = z.object({
  category: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  quantity: z.number().positive().optional(),
  unit: z.string().min(1).optional(),
  rate: z.number().min(0).optional(),
  sortOrder: z.number().int().optional(),
}).openapi('UpdateCostLineItemRequest');

// ============================================
// Routes
// ============================================

// POST /api/reports/:reportId/cost-estimate - Create cost estimate
registry.registerPath({
  method: 'post',
  path: '/api/reports/{reportId}/cost-estimate',
  summary: 'Create a cost estimate for a report',
  tags: ['Cost Estimates'],
  request: {
    params: z.object({
      reportId: z.string().uuid().openapi({ description: 'Report ID' }),
    }),
    body: {
      content: {
        'application/json': { schema: CreateCostEstimateSchema },
      },
    },
  },
  responses: {
    201: {
      description: 'Cost estimate created',
      content: {
        'application/json': { schema: CostEstimateResponseSchema },
      },
    },
    400: {
      description: 'Validation error',
      content: {
        'application/json': { schema: BadRequestErrorSchema },
      },
    },
    409: {
      description: 'Cost estimate already exists for this report',
      content: {
        'application/json': { schema: ConflictErrorSchema },
      },
    },
  },
});

// GET /api/reports/:reportId/cost-estimate - Get cost estimate
registry.registerPath({
  method: 'get',
  path: '/api/reports/{reportId}/cost-estimate',
  summary: 'Get cost estimate for a report',
  tags: ['Cost Estimates'],
  request: {
    params: z.object({
      reportId: z.string().uuid().openapi({ description: 'Report ID' }),
    }),
  },
  responses: {
    200: {
      description: 'Cost estimate details',
      content: {
        'application/json': { schema: CostEstimateResponseSchema },
      },
    },
    404: {
      description: 'Cost estimate not found',
      content: {
        'application/json': { schema: ErrorResponseSchema },
      },
    },
  },
});

// PUT /api/cost-estimates/:id - Update cost estimate
registry.registerPath({
  method: 'put',
  path: '/api/cost-estimates/{id}',
  summary: 'Update a cost estimate',
  tags: ['Cost Estimates'],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: 'Cost estimate ID' }),
    }),
    body: {
      content: {
        'application/json': { schema: UpdateCostEstimateSchema },
      },
    },
  },
  responses: {
    200: {
      description: 'Cost estimate updated',
      content: {
        'application/json': { schema: CostEstimateResponseSchema },
      },
    },
    404: {
      description: 'Cost estimate not found',
      content: {
        'application/json': { schema: ErrorResponseSchema },
      },
    },
  },
});

// DELETE /api/cost-estimates/:id - Delete cost estimate
registry.registerPath({
  method: 'delete',
  path: '/api/cost-estimates/{id}',
  summary: 'Delete a cost estimate',
  tags: ['Cost Estimates'],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: 'Cost estimate ID' }),
    }),
  },
  responses: {
    204: {
      description: 'Cost estimate deleted',
    },
    404: {
      description: 'Cost estimate not found',
      content: {
        'application/json': { schema: ErrorResponseSchema },
      },
    },
  },
});

// POST /api/cost-estimates/:id/line-items - Add line item
registry.registerPath({
  method: 'post',
  path: '/api/cost-estimates/{id}/line-items',
  summary: 'Add a line item to a cost estimate',
  tags: ['Cost Estimates'],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: 'Cost estimate ID' }),
    }),
    body: {
      content: {
        'application/json': { schema: CreateCostLineItemSchema },
      },
    },
  },
  responses: {
    201: {
      description: 'Line item added',
      content: {
        'application/json': { schema: CostLineItemSchema },
      },
    },
    400: {
      description: 'Validation error',
      content: {
        'application/json': { schema: BadRequestErrorSchema },
      },
    },
    404: {
      description: 'Cost estimate not found',
      content: {
        'application/json': { schema: ErrorResponseSchema },
      },
    },
  },
});

// PUT /api/cost-line-items/:id - Update line item
registry.registerPath({
  method: 'put',
  path: '/api/cost-line-items/{id}',
  summary: 'Update a cost line item',
  tags: ['Cost Estimates'],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: 'Line item ID' }),
    }),
    body: {
      content: {
        'application/json': { schema: UpdateCostLineItemSchema },
      },
    },
  },
  responses: {
    200: {
      description: 'Line item updated',
      content: {
        'application/json': { schema: CostLineItemSchema },
      },
    },
    404: {
      description: 'Line item not found',
      content: {
        'application/json': { schema: ErrorResponseSchema },
      },
    },
  },
});

// DELETE /api/cost-line-items/:id - Delete line item
registry.registerPath({
  method: 'delete',
  path: '/api/cost-line-items/{id}',
  summary: 'Delete a cost line item',
  tags: ['Cost Estimates'],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: 'Line item ID' }),
    }),
  },
  responses: {
    204: {
      description: 'Line item deleted',
    },
    404: {
      description: 'Line item not found',
      content: {
        'application/json': { schema: ErrorResponseSchema },
      },
    },
  },
});
