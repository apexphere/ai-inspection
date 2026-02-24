/**
 * OpenAPI Route Registration for Site Inspections
 * Issue #453
 */

import { z } from '../setup.js';
import { registry } from '../registry.js';
import { BadRequestErrorSchema, UnauthorizedErrorSchema } from '../schemas/errors.js';
import { ErrorResponseSchema } from '../schemas/common.js';

const ProjectIdParam = z.object({ projectId: z.string().uuid() });
const IdParam = z.object({ id: z.string().uuid() });

const SiteInspectionSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  inspectorId: z.string().uuid().nullable(),
  inspectionDate: z.string().datetime(),
  weather: z.string().nullable(),
  notes: z.string().nullable(),
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  deletedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).openapi('SiteInspection');

const CreateSiteInspectionSchema = z.object({
  inspectionDate: z.string().openapi({ example: '2026-03-01T09:00:00Z' }),
  inspectorId: z.string().uuid().optional(),
  weather: z.string().optional(),
  notes: z.string().optional(),
}).openapi('CreateSiteInspectionRequest');

registry.register('SiteInspection', SiteInspectionSchema);

registry.registerPath({
  method: 'post',
  path: '/api/projects/{projectId}/inspections',
  summary: 'Create site inspection for project',
  tags: ['Site Inspections'],
  request: {
    params: ProjectIdParam,
    body: { content: { 'application/json': { schema: CreateSiteInspectionSchema } }, required: true },
  },
  responses: {
    201: { description: 'Created', content: { 'application/json': { schema: SiteInspectionSchema } } },
    400: { description: 'Validation error', content: { 'application/json': { schema: BadRequestErrorSchema } } },
    401: { description: 'Unauthorized', content: { 'application/json': { schema: UnauthorizedErrorSchema } } },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/projects/{projectId}/inspections',
  summary: 'List site inspections for project',
  tags: ['Site Inspections'],
  request: { params: ProjectIdParam },
  responses: {
    200: { description: 'Inspections', content: { 'application/json': { schema: z.array(SiteInspectionSchema) } } },
    401: { description: 'Unauthorized', content: { 'application/json': { schema: UnauthorizedErrorSchema } } },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/site-inspections',
  summary: 'List all site inspections',
  tags: ['Site Inspections'],
  responses: {
    200: { description: 'All inspections', content: { 'application/json': { schema: z.array(SiteInspectionSchema) } } },
    401: { description: 'Unauthorized', content: { 'application/json': { schema: UnauthorizedErrorSchema } } },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/site-inspections/{id}',
  summary: 'Get site inspection by ID',
  tags: ['Site Inspections'],
  request: { params: IdParam },
  responses: {
    200: { description: 'Inspection details', content: { 'application/json': { schema: SiteInspectionSchema } } },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'put',
  path: '/api/site-inspections/{id}',
  summary: 'Update site inspection',
  tags: ['Site Inspections'],
  request: {
    params: IdParam,
    body: { content: { 'application/json': { schema: CreateSiteInspectionSchema.partial() } }, required: true },
  },
  responses: {
    200: { description: 'Updated', content: { 'application/json': { schema: SiteInspectionSchema } } },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/site-inspections/{id}',
  summary: 'Soft-delete site inspection',
  tags: ['Site Inspections'],
  request: { params: IdParam },
  responses: {
    200: { description: 'Soft-deleted', content: { 'application/json': { schema: SiteInspectionSchema } } },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/site-inspections/{id}/restore',
  summary: 'Restore soft-deleted inspection',
  tags: ['Site Inspections'],
  request: { params: IdParam },
  responses: {
    200: { description: 'Restored', content: { 'application/json': { schema: SiteInspectionSchema } } },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});
