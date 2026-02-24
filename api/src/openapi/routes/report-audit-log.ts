/**
 * OpenAPI Route Registration for Report Audit Log
 * Issue #497
 */

import { z } from '../setup.js';
import { registry } from '../registry.js';
import { ErrorResponseSchema } from '../schemas/common.js';
import { BadRequestErrorSchema } from '../schemas/errors.js';

// ============================================
// Schemas
// ============================================

const ReportAuditActionEnum = z.enum([
  'CREATED',
  'STATUS_CHANGED',
  'CONTENT_UPDATED',
  'VERSION_CREATED',
  'DELETED',
]);

const CreateAuditLogSchema = z.object({
  action: ReportAuditActionEnum.openapi({
    description: 'Audit action type',
    example: 'STATUS_CHANGED',
  }),
  userId: z.string().uuid().optional().openapi({
    description: 'ID of user who performed the action',
  }),
  changes: z.record(z.unknown()).optional().openapi({
    description: 'Details of changes made',
    example: { from: 'DRAFT', to: 'IN_REVIEW' },
  }),
}).openapi('CreateAuditLogRequest');

const AuditLogEntrySchema = z.object({
  id: z.string().uuid(),
  reportId: z.string().uuid(),
  action: ReportAuditActionEnum,
  userId: z.string().uuid().nullable(),
  changes: z.record(z.unknown()).nullable(),
  createdAt: z.string().datetime(),
}).openapi('AuditLogEntry');

const AuditLogListSchema = z.array(AuditLogEntrySchema).openapi('AuditLogList');

// ============================================
// Routes
// ============================================

// POST /api/reports/:reportId/audit-log - Record an audit entry
registry.registerPath({
  method: 'post',
  path: '/api/reports/{reportId}/audit-log',
  summary: 'Record an audit log entry',
  tags: ['Report Audit Log'],
  request: {
    params: z.object({
      reportId: z.string().uuid().openapi({ description: 'Report ID' }),
    }),
    body: {
      content: {
        'application/json': { schema: CreateAuditLogSchema },
      },
    },
  },
  responses: {
    201: {
      description: 'Audit log entry created',
      content: {
        'application/json': { schema: AuditLogEntrySchema },
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

// GET /api/reports/:reportId/audit-log - Get history for a report
registry.registerPath({
  method: 'get',
  path: '/api/reports/{reportId}/audit-log',
  summary: 'Get audit history for a report',
  tags: ['Report Audit Log'],
  request: {
    params: z.object({
      reportId: z.string().uuid().openapi({ description: 'Report ID' }),
    }),
  },
  responses: {
    200: {
      description: 'Audit log history',
      content: {
        'application/json': { schema: AuditLogListSchema },
      },
    },
  },
});

// GET /api/audit-log - Query across all reports
registry.registerPath({
  method: 'get',
  path: '/api/audit-log',
  summary: 'Query audit logs across all reports',
  tags: ['Report Audit Log'],
  request: {
    query: z.object({
      reportId: z.string().uuid().optional().openapi({ description: 'Filter by report ID' }),
      action: ReportAuditActionEnum.optional().openapi({ description: 'Filter by action type' }),
      userId: z.string().uuid().optional().openapi({ description: 'Filter by user ID' }),
      since: z.string().datetime().optional().openapi({ description: 'Filter entries since this date' }),
    }),
  },
  responses: {
    200: {
      description: 'Audit log entries',
      content: {
        'application/json': { schema: AuditLogListSchema },
      },
    },
  },
});

// GET /api/audit-log/:id - Get single entry
registry.registerPath({
  method: 'get',
  path: '/api/audit-log/{id}',
  summary: 'Get a single audit log entry',
  tags: ['Report Audit Log'],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: 'Audit log entry ID' }),
    }),
  },
  responses: {
    200: {
      description: 'Audit log entry',
      content: {
        'application/json': { schema: AuditLogEntrySchema },
      },
    },
    404: {
      description: 'Audit log entry not found',
      content: {
        'application/json': { schema: ErrorResponseSchema },
      },
    },
  },
});
