/**
 * OpenAPI Route Registration for Review Comments
 * Issue #497
 */

import { z } from '../setup.js';
import { registry } from '../registry.js';
import { ErrorResponseSchema } from '../schemas/common.js';
import { BadRequestErrorSchema } from '../schemas/errors.js';

// ============================================
// Schemas
// ============================================

const CommentPriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH']);
const CommentStatusEnum = z.enum(['OPEN', 'RESOLVED']);

const CreateCommentSchema = z.object({
  authorId: z.string().uuid().openapi({
    description: 'ID of the comment author',
  }),
  section: z.string().min(1).optional().openapi({
    description: 'Report section this comment refers to',
    example: 'Introduction',
  }),
  content: z.string().min(1).openapi({
    description: 'Comment content',
    example: 'Please clarify the methodology used for moisture readings.',
  }),
  priority: CommentPriorityEnum.default('MEDIUM').openapi({
    description: 'Comment priority',
    example: 'HIGH',
  }),
}).openapi('CreateCommentRequest');

const UpdateCommentSchema = z.object({
  content: z.string().min(1).optional(),
  section: z.string().min(1).nullable().optional(),
  priority: CommentPriorityEnum.optional(),
  status: CommentStatusEnum.optional(),
}).openapi('UpdateCommentRequest');

const CommentResponseSchema = z.object({
  id: z.string().uuid(),
  reportId: z.string().uuid(),
  authorId: z.string().uuid(),
  section: z.string().nullable(),
  content: z.string(),
  priority: CommentPriorityEnum,
  status: CommentStatusEnum,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  resolvedAt: z.string().datetime().nullable(),
}).openapi('CommentResponse');

const CommentListSchema = z.array(CommentResponseSchema).openapi('CommentList');

// ============================================
// Routes
// ============================================

// POST /api/reports/:reportId/comments - Add a comment
registry.registerPath({
  method: 'post',
  path: '/api/reports/{reportId}/comments',
  summary: 'Add a review comment',
  tags: ['Review Comments'],
  request: {
    params: z.object({
      reportId: z.string().uuid().openapi({ description: 'Report ID' }),
    }),
    body: {
      content: {
        'application/json': { schema: CreateCommentSchema },
      },
    },
  },
  responses: {
    201: {
      description: 'Comment created',
      content: {
        'application/json': { schema: CommentResponseSchema },
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

// GET /api/reports/:reportId/comments - List comments
registry.registerPath({
  method: 'get',
  path: '/api/reports/{reportId}/comments',
  summary: 'List review comments',
  description: 'List comments for a report with optional filters',
  tags: ['Review Comments'],
  request: {
    params: z.object({
      reportId: z.string().uuid().openapi({ description: 'Report ID' }),
    }),
    query: z.object({
      status: CommentStatusEnum.optional().openapi({ description: 'Filter by status' }),
      priority: CommentPriorityEnum.optional().openapi({ description: 'Filter by priority' }),
      authorId: z.string().uuid().optional().openapi({ description: 'Filter by author ID' }),
    }),
  },
  responses: {
    200: {
      description: 'List of comments',
      content: {
        'application/json': { schema: CommentListSchema },
      },
    },
    400: {
      description: 'Invalid filter parameters',
      content: {
        'application/json': { schema: BadRequestErrorSchema },
      },
    },
  },
});

// GET /api/reports/:reportId/comments/:id - Get single comment
registry.registerPath({
  method: 'get',
  path: '/api/reports/{reportId}/comments/{id}',
  summary: 'Get a review comment',
  tags: ['Review Comments'],
  request: {
    params: z.object({
      reportId: z.string().uuid().openapi({ description: 'Report ID' }),
      id: z.string().uuid().openapi({ description: 'Comment ID' }),
    }),
  },
  responses: {
    200: {
      description: 'Comment details',
      content: {
        'application/json': { schema: CommentResponseSchema },
      },
    },
    404: {
      description: 'Comment not found',
      content: {
        'application/json': { schema: ErrorResponseSchema },
      },
    },
  },
});

// PATCH /api/reports/:reportId/comments/:id - Update a comment
registry.registerPath({
  method: 'patch',
  path: '/api/reports/{reportId}/comments/{id}',
  summary: 'Update a review comment',
  tags: ['Review Comments'],
  request: {
    params: z.object({
      reportId: z.string().uuid().openapi({ description: 'Report ID' }),
      id: z.string().uuid().openapi({ description: 'Comment ID' }),
    }),
    body: {
      content: {
        'application/json': { schema: UpdateCommentSchema },
      },
    },
  },
  responses: {
    200: {
      description: 'Comment updated',
      content: {
        'application/json': { schema: CommentResponseSchema },
      },
    },
    400: {
      description: 'Validation error',
      content: {
        'application/json': { schema: BadRequestErrorSchema },
      },
    },
    404: {
      description: 'Comment not found',
      content: {
        'application/json': { schema: ErrorResponseSchema },
      },
    },
  },
});

// POST /api/reports/:reportId/comments/:id/resolve - Resolve a comment
registry.registerPath({
  method: 'post',
  path: '/api/reports/{reportId}/comments/{id}/resolve',
  summary: 'Resolve a review comment',
  tags: ['Review Comments'],
  request: {
    params: z.object({
      reportId: z.string().uuid().openapi({ description: 'Report ID' }),
      id: z.string().uuid().openapi({ description: 'Comment ID' }),
    }),
  },
  responses: {
    200: {
      description: 'Comment resolved',
      content: {
        'application/json': { schema: CommentResponseSchema },
      },
    },
    404: {
      description: 'Comment not found',
      content: {
        'application/json': { schema: ErrorResponseSchema },
      },
    },
  },
});

// POST /api/reports/:reportId/comments/:id/reopen - Reopen a comment
registry.registerPath({
  method: 'post',
  path: '/api/reports/{reportId}/comments/{id}/reopen',
  summary: 'Reopen a review comment',
  tags: ['Review Comments'],
  request: {
    params: z.object({
      reportId: z.string().uuid().openapi({ description: 'Report ID' }),
      id: z.string().uuid().openapi({ description: 'Comment ID' }),
    }),
  },
  responses: {
    200: {
      description: 'Comment reopened',
      content: {
        'application/json': { schema: CommentResponseSchema },
      },
    },
    404: {
      description: 'Comment not found',
      content: {
        'application/json': { schema: ErrorResponseSchema },
      },
    },
  },
});

// DELETE /api/reports/:reportId/comments/:id - Delete a comment
registry.registerPath({
  method: 'delete',
  path: '/api/reports/{reportId}/comments/{id}',
  summary: 'Delete a review comment',
  tags: ['Review Comments'],
  request: {
    params: z.object({
      reportId: z.string().uuid().openapi({ description: 'Report ID' }),
      id: z.string().uuid().openapi({ description: 'Comment ID' }),
    }),
  },
  responses: {
    204: {
      description: 'Comment deleted',
    },
    404: {
      description: 'Comment not found',
      content: {
        'application/json': { schema: ErrorResponseSchema },
      },
    },
  },
});
