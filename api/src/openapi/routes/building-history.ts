/**
 * OpenAPI Route Registration for Building History
 * Issue #453
 */

import { z } from '../setup.js';
import { registry } from '../registry.js';
import { BadRequestErrorSchema, UnauthorizedErrorSchema } from '../schemas/errors.js';
import { ErrorResponseSchema } from '../schemas/common.js';

const BuildingHistorySchema = z.object({
  id: z.string().uuid(),
  propertyId: z.string().uuid(),
  eventType: z.string(),
  eventDate: z.string().datetime().nullable(),
  description: z.string(),
  source: z.string().nullable(),
  metadata: z.unknown().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).openapi('BuildingHistory');

const CreateBuildingHistorySchema = z.object({
  eventType: z.string().min(1).openapi({ example: 'CONSENT_ISSUED' }),
  eventDate: z.string().optional(),
  description: z.string().min(1),
  source: z.string().optional(),
  metadata: z.unknown().optional(),
}).openapi('CreateBuildingHistoryRequest');

const PropertyIdParam = z.object({ propertyId: z.string().uuid() });
const IdParam = z.object({ id: z.string().uuid() });

registry.register('BuildingHistory', BuildingHistorySchema);

registry.registerPath({
  method: 'post',
  path: '/api/properties/{propertyId}/history',
  summary: 'Add building history event',
  tags: ['Building History'],
  request: {
    params: PropertyIdParam,
    body: { content: { 'application/json': { schema: CreateBuildingHistorySchema } }, required: true },
  },
  responses: {
    201: { description: 'History event created', content: { 'application/json': { schema: BuildingHistorySchema } } },
    400: { description: 'Validation error', content: { 'application/json': { schema: BadRequestErrorSchema } } },
    401: { description: 'Unauthorized', content: { 'application/json': { schema: UnauthorizedErrorSchema } } },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/properties/{propertyId}/history',
  summary: 'List building history for property',
  tags: ['Building History'],
  request: { params: PropertyIdParam },
  responses: {
    200: { description: 'History events', content: { 'application/json': { schema: z.array(BuildingHistorySchema) } } },
    401: { description: 'Unauthorized', content: { 'application/json': { schema: UnauthorizedErrorSchema } } },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/building-history/{id}',
  summary: 'Get history event by ID',
  tags: ['Building History'],
  request: { params: IdParam },
  responses: {
    200: { description: 'History event', content: { 'application/json': { schema: BuildingHistorySchema } } },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'put',
  path: '/api/building-history/{id}',
  summary: 'Update history event',
  tags: ['Building History'],
  request: {
    params: IdParam,
    body: { content: { 'application/json': { schema: CreateBuildingHistorySchema.partial() } }, required: true },
  },
  responses: {
    200: { description: 'Updated', content: { 'application/json': { schema: BuildingHistorySchema } } },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/building-history/{id}',
  summary: 'Delete history event',
  tags: ['Building History'],
  request: { params: IdParam },
  responses: {
    204: { description: 'Deleted' },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});
