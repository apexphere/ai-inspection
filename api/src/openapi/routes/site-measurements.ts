/**
 * OpenAPI Route Registration for Site Measurements
 * Issue #453
 */

import { z } from '../setup.js';
import { registry } from '../registry.js';
import { BadRequestErrorSchema, UnauthorizedErrorSchema } from '../schemas/errors.js';
import { ErrorResponseSchema } from '../schemas/common.js';

const InspectionIdParam = z.object({ inspectionId: z.string().uuid() });
const IdParam = z.object({ id: z.string().uuid() });

const SiteMeasurementSchema = z.object({
  id: z.string().uuid(),
  siteInspectionId: z.string().uuid(),
  measurementType: z.string(),
  location: z.string(),
  value: z.number(),
  unit: z.string(),
  notes: z.string().nullable(),
  isWithinRange: z.boolean().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).openapi('SiteMeasurement');

const CreateMeasurementSchema = z.object({
  measurementType: z.string().min(1).openapi({ example: 'MOISTURE' }),
  location: z.string().min(1).openapi({ example: 'Bathroom wall' }),
  value: z.number().openapi({ example: 18.5 }),
  unit: z.string().openapi({ example: '%' }),
  notes: z.string().optional(),
}).openapi('CreateMeasurementRequest');

const AcceptableRangeSchema = z.object({
  measurementType: z.string(),
  min: z.number().nullable(),
  max: z.number().nullable(),
  unit: z.string(),
  description: z.string(),
}).openapi('AcceptableRange');

registry.register('SiteMeasurement', SiteMeasurementSchema);

registry.registerPath({
  method: 'post',
  path: '/api/site-inspections/{inspectionId}/measurements',
  summary: 'Add measurement to inspection',
  tags: ['Site Measurements'],
  request: {
    params: InspectionIdParam,
    body: { content: { 'application/json': { schema: CreateMeasurementSchema } }, required: true },
  },
  responses: {
    201: { description: 'Created', content: { 'application/json': { schema: SiteMeasurementSchema } } },
    400: { description: 'Validation error', content: { 'application/json': { schema: BadRequestErrorSchema } } },
    401: { description: 'Unauthorized', content: { 'application/json': { schema: UnauthorizedErrorSchema } } },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/site-inspections/{inspectionId}/measurements',
  summary: 'List measurements for inspection',
  tags: ['Site Measurements'],
  request: { params: InspectionIdParam },
  responses: {
    200: { description: 'Measurements', content: { 'application/json': { schema: z.array(SiteMeasurementSchema) } } },
    401: { description: 'Unauthorized', content: { 'application/json': { schema: UnauthorizedErrorSchema } } },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/measurements/{id}',
  summary: 'Get measurement by ID',
  tags: ['Site Measurements'],
  request: { params: IdParam },
  responses: {
    200: { description: 'Measurement', content: { 'application/json': { schema: SiteMeasurementSchema } } },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'put',
  path: '/api/measurements/{id}',
  summary: 'Update measurement',
  tags: ['Site Measurements'],
  request: {
    params: IdParam,
    body: { content: { 'application/json': { schema: CreateMeasurementSchema.partial() } }, required: true },
  },
  responses: {
    200: { description: 'Updated', content: { 'application/json': { schema: SiteMeasurementSchema } } },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/measurements/{id}',
  summary: 'Delete measurement',
  tags: ['Site Measurements'],
  request: { params: IdParam },
  responses: {
    204: { description: 'Deleted' },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/measurements/acceptable-ranges',
  summary: 'Get acceptable measurement ranges',
  description: 'Reference data for acceptable ranges per measurement type.',
  tags: ['Site Measurements'],
  responses: {
    200: { description: 'Ranges', content: { 'application/json': { schema: z.array(AcceptableRangeSchema) } } },
  },
});
