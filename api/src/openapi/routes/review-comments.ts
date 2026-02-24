/**
 * OpenAPI Route Registration for Review Comments & Audit Log
 * Issue #503
 */

import { z } from '../setup.js';
import { registry } from '../registry.js';
import { ErrorResponseSchema } from '../schemas/common.js';

// ============================================
// Review Comments Schemas
// ============================================

const CreateCommentSchema = z.object({
  content: z.string().min(1).openapi({ example: 'Please clarify the moisture reading methodology.' }),
  sectionRef: z.string().optional().openapi({ example: 'section-5', description: 'Section reference' }),
  authorId: z.string().min(1),
}).openapi('CreateReviewCommentRequest');

const CommentResponseSchema = z.object({
  id: z.string().uuid(),
  reportId: z.string().uuid(),
  content: z.string(),
  sectionRef: z.string().nullable(),
  authorId: z.string(),
  status: z.enum(['OPEN', 'RESOLVED']),
  resolvedAt: z.string().datetime().nullable(),
  resolvedById: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).openapi('ReviewCommentResponse');

const CommentListResponseSchema = z.array(CommentResponseSchema).openapi('ReviewCommentListResponse');

const reportIdParam = z.object({ reportId: z.string().uuid().openapi({ description: 'Report ID' }) });
const commentIdParam = z.object({
  reportId: z.string().uuid().openapi({ description: 'Report ID' }),
  id: z.string().uuid().openapi({ description: 'Comment ID' }),
});

registry.registerPath({
  method: 'post', path: '/api/reports/{reportId}/comments', summary: 'Add review comment', tags: ['Review Comments'],
  request: { params: reportIdParam, body: { content: { 'application/json': { schema: CreateCommentSchema } } } },
  responses: {
    201: { description: 'Comment created', content: { 'application/json': { schema: CommentResponseSchema } } },
    400: { description: 'Validation error', content: { 'application/json': { schema: ErrorResponseSchema } } },
    404: { description: 'Report not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'get', path: '/api/reports/{reportId}/comments', summary: 'List review comments', tags: ['Review Comments'],
  request: {
    params: reportIdParam,
    query: z.object({ status: z.enum(['OPEN', 'RESOLVED']).optional() }),
  },
  responses: { 200: { description: 'Comments', content: { 'application/json': { schema: CommentListResponseSchema } } } },
});

registry.registerPath({
  method: 'get', path: '/api/reports/{reportId}/comments/{id}', summary: 'Get review comment', tags: ['Review Comments'],
  request: { params: commentIdParam },
  responses: {
    200: { description: 'Comment details', content: { 'application/json': { schema: CommentResponseSchema } } },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'post', path: '/api/reports/{reportId}/comments/{id}/resolve', summary: 'Resolve comment', tags: ['Review Comments'],
  request: { params: commentIdParam },
  responses: {
    200: { description: 'Comment resolved', content: { 'application/json': { schema: CommentResponseSchema } } },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'post', path: '/api/reports/{reportId}/comments/{id}/reopen', summary: 'Reopen comment', tags: ['Review Comments'],
  request: { params: commentIdParam },
  responses: {
    200: { description: 'Comment reopened', content: { 'application/json': { schema: CommentResponseSchema } } },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'delete', path: '/api/reports/{reportId}/comments/{id}', summary: 'Delete comment', tags: ['Review Comments'],
  request: { params: commentIdParam },
  responses: {
    204: { description: 'Comment deleted' },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

// ============================================
// Audit Log Schemas
// ============================================

const CreateAuditLogSchema = z.object({
  action: z.string().min(1).openapi({ example: 'STATUS_CHANGED' }),
  userId: z.string().min(1),
  changes: z.record(z.unknown()).optional(),
}).openapi('CreateAuditLogRequest');

const AuditLogResponseSchema = z.object({
  id: z.string().uuid(),
  reportId: z.string().uuid(),
  action: z.string(),
  userId: z.string(),
  changes: z.unknown().nullable(),
  createdAt: z.string().datetime(),
}).openapi('AuditLogResponse');

const AuditLogListResponseSchema = z.array(AuditLogResponseSchema).openapi('AuditLogListResponse');

const auditReportIdParam = z.object({ reportId: z.string().uuid().openapi({ description: 'Report ID' }) });
const auditLogIdParam = z.object({ id: z.string().uuid().openapi({ description: 'Audit Log ID' }) });

registry.registerPath({
  method: 'post', path: '/api/reports/{reportId}/audit-log', summary: 'Create audit log entry', tags: ['Audit Log'],
  request: { params: auditReportIdParam, body: { content: { 'application/json': { schema: CreateAuditLogSchema } } } },
  responses: {
    201: { description: 'Audit log created', content: { 'application/json': { schema: AuditLogResponseSchema } } },
    400: { description: 'Validation error', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'get', path: '/api/reports/{reportId}/audit-log', summary: 'List audit log for report', tags: ['Audit Log'],
  request: { params: auditReportIdParam },
  responses: { 200: { description: 'Audit log entries', content: { 'application/json': { schema: AuditLogListResponseSchema } } } },
});

registry.registerPath({
  method: 'get', path: '/api/audit-log', summary: 'List all audit log entries', tags: ['Audit Log'],
  request: {
    query: z.object({
      reportId: z.string().uuid().optional(),
      userId: z.string().optional(),
      action: z.string().optional(),
    }),
  },
  responses: { 200: { description: 'Audit log entries', content: { 'application/json': { schema: AuditLogListResponseSchema } } } },
});

registry.registerPath({
  method: 'get', path: '/api/audit-log/{id}', summary: 'Get audit log entry', tags: ['Audit Log'],
  request: { params: auditLogIdParam },
  responses: {
    200: { description: 'Audit log entry', content: { 'application/json': { schema: AuditLogResponseSchema } } },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});
