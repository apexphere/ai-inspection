/**
 * OpenAPI Route Registration for Report Transitions
 * Issue #497
 */

import { z } from '../setup.js';
import { registry } from '../registry.js';
import { ErrorResponseSchema } from '../schemas/common.js';
import { BadRequestErrorSchema, ForbiddenErrorSchema } from '../schemas/errors.js';

// ============================================
// Schemas
// ============================================

const TransitionActionEnum = z.enum([
  'submitForReview',
  'requestChanges',
  'approve',
  'finalize',
  'markSubmitted',
]);

const ReportRoleEnum = z.enum(['AUTHOR', 'REVIEWER', 'ADMIN']);
const ReportStatusEnum = z.enum(['DRAFT', 'IN_REVIEW', 'APPROVED', 'FINALIZED', 'SUBMITTED']);

const TransitionRequestSchema = z.object({
  action: TransitionActionEnum.openapi({
    description: 'Transition action to execute',
    example: 'submitForReview',
  }),
  role: ReportRoleEnum.openapi({
    description: 'Role of the user performing the action',
    example: 'AUTHOR',
  }),
  userId: z.string().min(1).openapi({
    description: 'ID of the user performing the action',
  }),
}).openapi('TransitionRequest');

const TransitionResultSchema = z.object({
  report: z.object({
    id: z.string().uuid(),
    status: ReportStatusEnum,
    siteInspectionId: z.string().uuid(),
    preparedById: z.string().nullable(),
    reviewedById: z.string().nullable(),
    reviewedAt: z.string().datetime().nullable(),
    updatedAt: z.string().datetime(),
  }),
  transition: z.object({
    from: ReportStatusEnum,
    to: ReportStatusEnum,
    action: TransitionActionEnum,
    performedBy: z.string(),
  }),
}).openapi('TransitionResult');

const AvailableTransitionSchema = z.object({
  action: TransitionActionEnum,
  targetStatus: ReportStatusEnum,
  allowedRoles: z.array(ReportRoleEnum),
}).openapi('AvailableTransition');

const AvailableTransitionsResponseSchema = z.object({
  currentStatus: ReportStatusEnum,
  availableTransitions: z.array(AvailableTransitionSchema),
}).openapi('AvailableTransitionsResponse');

const TransitionDefinitionSchema = z.object({
  from: ReportStatusEnum,
  to: ReportStatusEnum,
  action: TransitionActionEnum,
  allowedRoles: z.array(ReportRoleEnum),
}).openapi('TransitionDefinition');

const AllTransitionsResponseSchema = z.array(TransitionDefinitionSchema).openapi('AllTransitionsResponse');

// ============================================
// Routes
// ============================================

// POST /api/reports/:id/transition - Execute a status transition
registry.registerPath({
  method: 'post',
  path: '/api/reports/{id}/transition',
  summary: 'Execute a report status transition',
  description: 'Execute a status transition with role-based validation',
  tags: ['Report Transitions'],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: 'Report ID' }),
    }),
    body: {
      content: {
        'application/json': { schema: TransitionRequestSchema },
      },
    },
  },
  responses: {
    200: {
      description: 'Transition executed successfully',
      content: {
        'application/json': { schema: TransitionResultSchema },
      },
    },
    400: {
      description: 'Invalid transition',
      content: {
        'application/json': { schema: BadRequestErrorSchema },
      },
    },
    403: {
      description: 'Insufficient role for this transition',
      content: {
        'application/json': { schema: ForbiddenErrorSchema },
      },
    },
    404: {
      description: 'Report not found',
      content: {
        'application/json': { schema: ErrorResponseSchema },
      },
    },
  },
});

// GET /api/reports/:id/transitions - Get available transitions
registry.registerPath({
  method: 'get',
  path: '/api/reports/{id}/transitions',
  summary: 'Get available transitions for a report',
  description: 'Get transitions available for the current status, optionally filtered by role',
  tags: ['Report Transitions'],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: 'Report ID' }),
    }),
    query: z.object({
      role: ReportRoleEnum.optional().openapi({ description: 'Filter transitions by role' }),
    }),
  },
  responses: {
    200: {
      description: 'Available transitions',
      content: {
        'application/json': { schema: AvailableTransitionsResponseSchema },
      },
    },
    404: {
      description: 'Report not found',
      content: {
        'application/json': { schema: ErrorResponseSchema },
      },
    },
  },
});

// GET /api/reports/transitions/all - Get all defined transitions
registry.registerPath({
  method: 'get',
  path: '/api/reports/transitions/all',
  summary: 'Get all defined transitions',
  description: 'Get all possible status transitions (for documentation)',
  tags: ['Report Transitions'],
  responses: {
    200: {
      description: 'All transitions',
      content: {
        'application/json': { schema: AllTransitionsResponseSchema },
      },
    },
  },
});
