/**
 * OpenAPI Route Registration for Navigation
 * Issue #453
 */

import { z } from '../setup.js';
import { registry } from '../registry.js';
import { BadRequestErrorSchema, UnauthorizedErrorSchema } from '../schemas/errors.js';
import { ErrorResponseSchema } from '../schemas/common.js';

const InspectionIdParam = z.object({ inspectionId: z.string().uuid() });

const NavigateRequestSchema = z.object({
  section: z.string().min(1).openapi({ example: 'exterior-cladding' }),
}).openapi('NavigateRequest');

const NavigationStatusSchema = z.object({
  currentSection: z.string().nullable(),
  progress: z.object({
    completed: z.number(),
    total: z.number(),
  }),
  findingsCount: z.number(),
}).openapi('NavigationStatus');

const SuggestResponseSchema = z.object({
  nextItems: z.array(z.string()),
  canComplete: z.boolean(),
}).openapi('SuggestResponse');

registry.registerPath({
  method: 'post',
  path: '/api/inspections/{inspectionId}/navigate',
  summary: 'Navigate to inspection section',
  tags: ['Navigation'],
  request: {
    params: InspectionIdParam,
    body: { content: { 'application/json': { schema: NavigateRequestSchema } }, required: true },
  },
  responses: {
    200: { description: 'Navigated', content: { 'application/json': { schema: NavigationStatusSchema } } },
    400: { description: 'Invalid section', content: { 'application/json': { schema: BadRequestErrorSchema } } },
    404: { description: 'Inspection not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
    401: { description: 'Unauthorized', content: { 'application/json': { schema: UnauthorizedErrorSchema } } },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/inspections/{inspectionId}/status',
  summary: 'Get inspection progress status',
  tags: ['Navigation'],
  request: { params: InspectionIdParam },
  responses: {
    200: { description: 'Status', content: { 'application/json': { schema: NavigationStatusSchema } } },
    404: { description: 'Inspection not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
    401: { description: 'Unauthorized', content: { 'application/json': { schema: UnauthorizedErrorSchema } } },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/inspections/{inspectionId}/suggest',
  summary: 'Get next suggested actions',
  tags: ['Navigation'],
  request: { params: InspectionIdParam },
  responses: {
    200: { description: 'Suggestions', content: { 'application/json': { schema: SuggestResponseSchema } } },
    404: { description: 'Inspection not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
    401: { description: 'Unauthorized', content: { 'application/json': { schema: UnauthorizedErrorSchema } } },
  },
});
