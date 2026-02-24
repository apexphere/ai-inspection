/**
 * OpenAPI Route Registration for Properties
 * Issue #453
 */

import { z } from '../setup.js';
import { registry } from '../registry.js';
import { BadRequestErrorSchema, UnauthorizedErrorSchema } from '../schemas/errors.js';
import { ErrorResponseSchema } from '../schemas/common.js';

const PropertySchema = z.object({
  id: z.string().uuid(),
  address: z.string(),
  suburb: z.string().nullable(),
  city: z.string().nullable(),
  postcode: z.string().nullable(),
  region: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).openapi('Property');

const CreatePropertySchema = z.object({
  address: z.string().min(1).openapi({ example: '123 Queen Street' }),
  suburb: z.string().optional(),
  city: z.string().optional().openapi({ example: 'Auckland' }),
  postcode: z.string().optional(),
  region: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
}).openapi('CreatePropertyRequest');

const IdParam = z.object({ id: z.string().uuid() });

registry.register('Property', PropertySchema);

registry.registerPath({
  method: 'post',
  path: '/api/properties',
  summary: 'Create a new property',
  tags: ['Properties'],
  request: { body: { content: { 'application/json': { schema: CreatePropertySchema } }, required: true } },
  responses: {
    201: { description: 'Property created', content: { 'application/json': { schema: PropertySchema } } },
    400: { description: 'Validation error', content: { 'application/json': { schema: BadRequestErrorSchema } } },
    401: { description: 'Unauthorized', content: { 'application/json': { schema: UnauthorizedErrorSchema } } },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/properties',
  summary: 'List all properties',
  tags: ['Properties'],
  responses: {
    200: { description: 'List of properties', content: { 'application/json': { schema: z.array(PropertySchema) } } },
    401: { description: 'Unauthorized', content: { 'application/json': { schema: UnauthorizedErrorSchema } } },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/properties/{id}',
  summary: 'Get property by ID',
  tags: ['Properties'],
  request: { params: IdParam },
  responses: {
    200: { description: 'Property details', content: { 'application/json': { schema: PropertySchema } } },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
    401: { description: 'Unauthorized', content: { 'application/json': { schema: UnauthorizedErrorSchema } } },
  },
});

registry.registerPath({
  method: 'put',
  path: '/api/properties/{id}',
  summary: 'Update property',
  tags: ['Properties'],
  request: {
    params: IdParam,
    body: { content: { 'application/json': { schema: CreatePropertySchema.partial() } }, required: true },
  },
  responses: {
    200: { description: 'Property updated', content: { 'application/json': { schema: PropertySchema } } },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
    401: { description: 'Unauthorized', content: { 'application/json': { schema: UnauthorizedErrorSchema } } },
  },
});
