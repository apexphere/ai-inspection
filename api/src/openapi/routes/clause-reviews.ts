/**
 * OpenAPI Route Registration for Clause Reviews
 * Issue #453
 */

import { z } from '../setup.js';
import { registry } from '../registry.js';
import { BadRequestErrorSchema, UnauthorizedErrorSchema } from '../schemas/errors.js';
import { ErrorResponseSchema } from '../schemas/common.js';

const InspectionIdParam = z.object({ inspectionId: z.string().uuid() });
const IdParam = z.object({ id: z.string().uuid() });

const ClauseReviewSchema = z.object({
  id: z.string().uuid(),
  siteInspectionId: z.string().uuid(),
  clauseId: z.string().uuid(),
  status: z.enum(['NOT_REVIEWED', 'COMPLIANT', 'NON_COMPLIANT', 'NA', 'PARTIALLY_COMPLIANT']),
  evidence: z.string().nullable(),
  notes: z.string().nullable(),
  naReason: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).openapi('ClauseReview');

const CreateClauseReviewSchema = z.object({
  clauseId: z.string().uuid(),
  status: z.enum(['NOT_REVIEWED', 'COMPLIANT', 'NON_COMPLIANT', 'NA', 'PARTIALLY_COMPLIANT']).optional(),
  evidence: z.string().optional(),
  notes: z.string().optional(),
}).openapi('CreateClauseReviewRequest');

const ClauseReviewSummarySchema = z.object({
  total: z.number(),
  reviewed: z.number(),
  compliant: z.number(),
  nonCompliant: z.number(),
  na: z.number(),
}).openapi('ClauseReviewSummary');

registry.register('ClauseReview', ClauseReviewSchema);

registry.registerPath({
  method: 'post',
  path: '/api/site-inspections/{inspectionId}/clause-reviews',
  summary: 'Create clause review',
  tags: ['Clause Reviews'],
  request: {
    params: InspectionIdParam,
    body: { content: { 'application/json': { schema: CreateClauseReviewSchema } }, required: true },
  },
  responses: {
    201: { description: 'Created', content: { 'application/json': { schema: ClauseReviewSchema } } },
    400: { description: 'Validation error', content: { 'application/json': { schema: BadRequestErrorSchema } } },
    401: { description: 'Unauthorized', content: { 'application/json': { schema: UnauthorizedErrorSchema } } },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/site-inspections/{inspectionId}/clause-reviews/bulk',
  summary: 'Bulk create clause reviews',
  tags: ['Clause Reviews'],
  request: {
    params: InspectionIdParam,
    body: { content: { 'application/json': { schema: z.object({ reviews: z.array(CreateClauseReviewSchema) }) } }, required: true },
  },
  responses: {
    201: { description: 'Created', content: { 'application/json': { schema: z.array(ClauseReviewSchema) } } },
    400: { description: 'Validation error', content: { 'application/json': { schema: BadRequestErrorSchema } } },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/site-inspections/{inspectionId}/clause-reviews/init',
  summary: 'Initialize clause reviews from building code',
  tags: ['Clause Reviews'],
  request: {
    params: InspectionIdParam,
    body: { content: { 'application/json': { schema: z.object({ clauseIds: z.array(z.string().uuid()) }) } }, required: true },
  },
  responses: {
    201: { description: 'Initialized', content: { 'application/json': { schema: z.array(ClauseReviewSchema) } } },
    400: { description: 'Validation error', content: { 'application/json': { schema: BadRequestErrorSchema } } },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/site-inspections/{inspectionId}/clause-reviews',
  summary: 'List clause reviews for inspection',
  tags: ['Clause Reviews'],
  request: { params: InspectionIdParam },
  responses: {
    200: { description: 'Clause reviews', content: { 'application/json': { schema: z.array(ClauseReviewSchema) } } },
    401: { description: 'Unauthorized', content: { 'application/json': { schema: UnauthorizedErrorSchema } } },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/site-inspections/{inspectionId}/clause-review-summary',
  summary: 'Get clause review summary',
  tags: ['Clause Reviews'],
  request: { params: InspectionIdParam },
  responses: {
    200: { description: 'Summary', content: { 'application/json': { schema: ClauseReviewSummarySchema } } },
    401: { description: 'Unauthorized', content: { 'application/json': { schema: UnauthorizedErrorSchema } } },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/clause-reviews/{id}',
  summary: 'Get clause review by ID',
  tags: ['Clause Reviews'],
  request: { params: IdParam },
  responses: {
    200: { description: 'Clause review', content: { 'application/json': { schema: ClauseReviewSchema } } },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'put',
  path: '/api/clause-reviews/{id}',
  summary: 'Update clause review',
  tags: ['Clause Reviews'],
  request: {
    params: IdParam,
    body: { content: { 'application/json': { schema: CreateClauseReviewSchema.partial() } }, required: true },
  },
  responses: {
    200: { description: 'Updated', content: { 'application/json': { schema: ClauseReviewSchema } } },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/clause-reviews/{id}/mark-na',
  summary: 'Mark clause as not applicable',
  tags: ['Clause Reviews'],
  request: {
    params: IdParam,
    body: { content: { 'application/json': { schema: z.object({ reason: z.string().min(1) }) } }, required: true },
  },
  responses: {
    200: { description: 'Marked NA', content: { 'application/json': { schema: ClauseReviewSchema } } },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/clause-reviews/{id}/mark-applicable',
  summary: 'Mark clause as applicable (undo NA)',
  tags: ['Clause Reviews'],
  request: { params: IdParam },
  responses: {
    200: { description: 'Marked applicable', content: { 'application/json': { schema: ClauseReviewSchema } } },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/clause-reviews/{id}',
  summary: 'Delete clause review',
  tags: ['Clause Reviews'],
  request: { params: IdParam },
  responses: {
    204: { description: 'Deleted' },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});
