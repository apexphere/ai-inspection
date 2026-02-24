/**
 * OpenAPI Route Registration for Project Photos
 * Issue #453
 */

import { z } from '../setup.js';
import { registry } from '../registry.js';
import { BadRequestErrorSchema, UnauthorizedErrorSchema } from '../schemas/errors.js';
import { ErrorResponseSchema } from '../schemas/common.js';

const ProjectIdParam = z.object({ projectId: z.string().uuid() });
const IdParam = z.object({ id: z.string().uuid() });

const ProjectPhotoSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  filename: z.string(),
  originalName: z.string(),
  mimeType: z.string(),
  size: z.number(),
  caption: z.string().nullable(),
  category: z.string().nullable(),
  sortOrder: z.number(),
  storagePath: z.string(),
  thumbnailPath: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).openapi('ProjectPhoto');

const UpdatePhotoSchema = z.object({
  caption: z.string().optional(),
  category: z.string().optional(),
}).openapi('UpdateProjectPhotoRequest');

const Base64UploadSchema = z.object({
  data: z.string().openapi({ description: 'Base64-encoded image data' }),
  filename: z.string(),
  mimeType: z.string().openapi({ example: 'image/jpeg' }),
  caption: z.string().optional(),
  category: z.string().optional(),
}).openapi('Base64PhotoUpload');

const PhotoUrlSchema = z.object({
  url: z.string().url(),
  expiresAt: z.string().datetime(),
}).openapi('PhotoUrl');

registry.register('ProjectPhoto', ProjectPhotoSchema);

registry.registerPath({
  method: 'post',
  path: '/api/projects/{projectId}/photos',
  summary: 'Upload photo to project (multipart)',
  tags: ['Project Photos'],
  request: { params: ProjectIdParam },
  responses: {
    201: { description: 'Photo uploaded', content: { 'application/json': { schema: ProjectPhotoSchema } } },
    400: { description: 'Invalid file', content: { 'application/json': { schema: BadRequestErrorSchema } } },
    401: { description: 'Unauthorized', content: { 'application/json': { schema: UnauthorizedErrorSchema } } },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/projects/{projectId}/photos/base64',
  summary: 'Upload photo as base64',
  tags: ['Project Photos'],
  request: {
    params: ProjectIdParam,
    body: { content: { 'application/json': { schema: Base64UploadSchema } }, required: true },
  },
  responses: {
    201: { description: 'Photo uploaded', content: { 'application/json': { schema: ProjectPhotoSchema } } },
    400: { description: 'Validation error', content: { 'application/json': { schema: BadRequestErrorSchema } } },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/projects/{projectId}/photos',
  summary: 'List photos for project',
  tags: ['Project Photos'],
  request: { params: ProjectIdParam },
  responses: {
    200: { description: 'Photos', content: { 'application/json': { schema: z.array(ProjectPhotoSchema) } } },
    401: { description: 'Unauthorized', content: { 'application/json': { schema: UnauthorizedErrorSchema } } },
  },
});

registry.registerPath({
  method: 'put',
  path: '/api/projects/{projectId}/photos/reorder',
  summary: 'Reorder project photos',
  tags: ['Project Photos'],
  request: {
    params: ProjectIdParam,
    body: { content: { 'application/json': { schema: z.object({ ids: z.array(z.string().uuid()) }) } }, required: true },
  },
  responses: {
    200: { description: 'Reordered', content: { 'application/json': { schema: z.array(ProjectPhotoSchema) } } },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/photos/{id}',
  summary: 'Get photo metadata',
  tags: ['Project Photos'],
  request: { params: IdParam },
  responses: {
    200: { description: 'Photo metadata', content: { 'application/json': { schema: ProjectPhotoSchema } } },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/photos/{id}/url',
  summary: 'Get presigned download URL',
  tags: ['Project Photos'],
  request: { params: IdParam },
  responses: {
    200: { description: 'Download URL', content: { 'application/json': { schema: PhotoUrlSchema } } },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'put',
  path: '/api/photos/{id}',
  summary: 'Update photo metadata',
  tags: ['Project Photos'],
  request: {
    params: IdParam,
    body: { content: { 'application/json': { schema: UpdatePhotoSchema } }, required: true },
  },
  responses: {
    200: { description: 'Updated', content: { 'application/json': { schema: ProjectPhotoSchema } } },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/photos/{id}',
  summary: 'Delete photo',
  tags: ['Project Photos'],
  request: { params: IdParam },
  responses: {
    204: { description: 'Deleted' },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});
