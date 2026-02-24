/**
 * OpenAPI Route Registration for Documents
 * Issue #453
 */

import { z } from '../setup.js';
import { registry } from '../registry.js';
import { BadRequestErrorSchema, UnauthorizedErrorSchema } from '../schemas/errors.js';
import { ErrorResponseSchema } from '../schemas/common.js';

const ProjectIdParam = z.object({ projectId: z.string().uuid() });
const IdParam = z.object({ id: z.string().uuid() });

const DocumentSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  title: z.string(),
  category: z.string(),
  status: z.enum(['PENDING', 'RECEIVED', 'VERIFIED', 'REJECTED']),
  filePath: z.string().nullable(),
  fileType: z.string().nullable(),
  notes: z.string().nullable(),
  sortOrder: z.number(),
  verified: z.boolean(),
  verifiedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).openapi('Document');

const CreateDocumentSchema = z.object({
  title: z.string().min(1),
  category: z.string().min(1).openapi({ example: 'CONSENT' }),
  status: z.enum(['PENDING', 'RECEIVED', 'VERIFIED', 'REJECTED']).optional(),
  notes: z.string().optional(),
  sortOrder: z.number().optional(),
}).openapi('CreateDocumentRequest');

const DocumentSummarySchema = z.object({
  total: z.number(),
  byStatus: z.record(z.number()),
  byCategory: z.record(z.number()),
}).openapi('DocumentSummary');

const CanFinalizeSchema = z.object({
  canFinalize: z.boolean(),
  missingDocuments: z.array(z.string()),
}).openapi('CanFinalizeResponse');

registry.register('Document', DocumentSchema);

registry.registerPath({
  method: 'post',
  path: '/api/projects/{projectId}/documents',
  summary: 'Create document record',
  tags: ['Documents'],
  request: {
    params: ProjectIdParam,
    body: { content: { 'application/json': { schema: CreateDocumentSchema } }, required: true },
  },
  responses: {
    201: { description: 'Created', content: { 'application/json': { schema: DocumentSchema } } },
    400: { description: 'Validation error', content: { 'application/json': { schema: BadRequestErrorSchema } } },
    401: { description: 'Unauthorized', content: { 'application/json': { schema: UnauthorizedErrorSchema } } },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/projects/{projectId}/documents',
  summary: 'List documents for project',
  tags: ['Documents'],
  request: { params: ProjectIdParam },
  responses: {
    200: { description: 'Documents', content: { 'application/json': { schema: z.array(DocumentSchema) } } },
    401: { description: 'Unauthorized', content: { 'application/json': { schema: UnauthorizedErrorSchema } } },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/projects/{projectId}/documents/summary',
  summary: 'Get document summary for project',
  tags: ['Documents'],
  request: { params: ProjectIdParam },
  responses: {
    200: { description: 'Summary', content: { 'application/json': { schema: DocumentSummarySchema } } },
  },
});

registry.registerPath({
  method: 'put',
  path: '/api/projects/{projectId}/documents/reorder',
  summary: 'Reorder documents',
  tags: ['Documents'],
  request: {
    params: ProjectIdParam,
    body: { content: { 'application/json': { schema: z.object({ ids: z.array(z.string().uuid()) }) } }, required: true },
  },
  responses: {
    200: { description: 'Reordered', content: { 'application/json': { schema: z.array(DocumentSchema) } } },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/projects/{projectId}/documents/can-finalize',
  summary: 'Check if project documents are complete for finalization',
  tags: ['Documents'],
  request: { params: ProjectIdParam },
  responses: {
    200: { description: 'Finalization check', content: { 'application/json': { schema: CanFinalizeSchema } } },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/documents/{id}',
  summary: 'Get document by ID',
  tags: ['Documents'],
  request: { params: IdParam },
  responses: {
    200: { description: 'Document', content: { 'application/json': { schema: DocumentSchema } } },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'put',
  path: '/api/documents/{id}',
  summary: 'Update document',
  tags: ['Documents'],
  request: {
    params: IdParam,
    body: { content: { 'application/json': { schema: CreateDocumentSchema.partial() } }, required: true },
  },
  responses: {
    200: { description: 'Updated', content: { 'application/json': { schema: DocumentSchema } } },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/documents/{id}',
  summary: 'Delete document',
  tags: ['Documents'],
  request: { params: IdParam },
  responses: {
    204: { description: 'Deleted' },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/documents/{id}/verify',
  summary: 'Mark document as verified',
  tags: ['Documents'],
  request: { params: IdParam },
  responses: {
    200: { description: 'Verified', content: { 'application/json': { schema: DocumentSchema } } },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/documents/{id}/unverify',
  summary: 'Remove verified status',
  tags: ['Documents'],
  request: { params: IdParam },
  responses: {
    200: { description: 'Unverified', content: { 'application/json': { schema: DocumentSchema } } },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});
