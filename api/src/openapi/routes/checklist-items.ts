/**
 * OpenAPI Route Registration for Checklist Items
 * Issue #453
 */

import { z } from '../setup.js';
import { registry } from '../registry.js';
import { BadRequestErrorSchema, UnauthorizedErrorSchema } from '../schemas/errors.js';
import { ErrorResponseSchema } from '../schemas/common.js';

const InspectionIdParam = z.object({ inspectionId: z.string().uuid() });
const IdParam = z.object({ id: z.string().uuid() });

const ChecklistItemSchema = z.object({
  id: z.string().uuid(),
  siteInspectionId: z.string().uuid(),
  section: z.string(),
  label: z.string(),
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'PASS', 'FAIL', 'NA']),
  notes: z.string().nullable(),
  sortOrder: z.number(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).openapi('ChecklistItem');

const CreateChecklistItemSchema = z.object({
  section: z.string().min(1),
  label: z.string().min(1),
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'PASS', 'FAIL', 'NA']).optional(),
  notes: z.string().optional(),
  sortOrder: z.number().optional(),
}).openapi('CreateChecklistItemRequest');

const ChecklistSummarySchema = z.object({
  total: z.number(),
  byStatus: z.record(z.number()),
  sections: z.array(z.object({
    section: z.string(),
    total: z.number(),
    completed: z.number(),
  })),
}).openapi('ChecklistSummary');

registry.register('ChecklistItem', ChecklistItemSchema);

registry.registerPath({
  method: 'post',
  path: '/api/site-inspections/{inspectionId}/checklist-items',
  summary: 'Create checklist item',
  tags: ['Checklist Items'],
  request: {
    params: InspectionIdParam,
    body: { content: { 'application/json': { schema: CreateChecklistItemSchema } }, required: true },
  },
  responses: {
    201: { description: 'Created', content: { 'application/json': { schema: ChecklistItemSchema } } },
    400: { description: 'Validation error', content: { 'application/json': { schema: BadRequestErrorSchema } } },
    401: { description: 'Unauthorized', content: { 'application/json': { schema: UnauthorizedErrorSchema } } },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/site-inspections/{inspectionId}/checklist-items/bulk',
  summary: 'Bulk create checklist items (max 100)',
  tags: ['Checklist Items'],
  request: {
    params: InspectionIdParam,
    body: {
      content: { 'application/json': { schema: z.object({ items: z.array(CreateChecklistItemSchema).max(100) }) } },
      required: true,
    },
  },
  responses: {
    201: { description: 'Created', content: { 'application/json': { schema: z.array(ChecklistItemSchema) } } },
    400: { description: 'Validation error', content: { 'application/json': { schema: BadRequestErrorSchema } } },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/site-inspections/{inspectionId}/checklist-items',
  summary: 'List checklist items for inspection',
  tags: ['Checklist Items'],
  request: { params: InspectionIdParam },
  responses: {
    200: { description: 'Checklist items', content: { 'application/json': { schema: z.array(ChecklistItemSchema) } } },
    401: { description: 'Unauthorized', content: { 'application/json': { schema: UnauthorizedErrorSchema } } },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/site-inspections/{inspectionId}/checklist-summary',
  summary: 'Get checklist completion summary',
  tags: ['Checklist Items'],
  request: { params: InspectionIdParam },
  responses: {
    200: { description: 'Summary', content: { 'application/json': { schema: ChecklistSummarySchema } } },
    401: { description: 'Unauthorized', content: { 'application/json': { schema: UnauthorizedErrorSchema } } },
  },
});

registry.registerPath({
  method: 'put',
  path: '/api/site-inspections/{inspectionId}/checklist-items/reorder',
  summary: 'Reorder checklist items',
  tags: ['Checklist Items'],
  request: {
    params: InspectionIdParam,
    body: { content: { 'application/json': { schema: z.object({ ids: z.array(z.string().uuid()) }) } }, required: true },
  },
  responses: {
    200: { description: 'Reordered', content: { 'application/json': { schema: z.array(ChecklistItemSchema) } } },
    400: { description: 'Validation error', content: { 'application/json': { schema: BadRequestErrorSchema } } },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/checklist-items/{id}',
  summary: 'Get checklist item by ID',
  tags: ['Checklist Items'],
  request: { params: IdParam },
  responses: {
    200: { description: 'Item', content: { 'application/json': { schema: ChecklistItemSchema } } },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'put',
  path: '/api/checklist-items/{id}',
  summary: 'Update checklist item',
  tags: ['Checklist Items'],
  request: {
    params: IdParam,
    body: { content: { 'application/json': { schema: CreateChecklistItemSchema.partial() } }, required: true },
  },
  responses: {
    200: { description: 'Updated', content: { 'application/json': { schema: ChecklistItemSchema } } },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/checklist-items/{id}',
  summary: 'Delete checklist item',
  tags: ['Checklist Items'],
  request: { params: IdParam },
  responses: {
    204: { description: 'Deleted' },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});
