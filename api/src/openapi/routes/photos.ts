/**
 * OpenAPI Route Registration for Photos
 * Issue #431
 */

import { z } from '../setup.js';
import { registry } from '../registry.js';
import {
  PhotoResponseSchema,
  PhotoUploadResponseSchema,
} from '../schemas/photo.js';
import { ValidationErrorSchema, NotFoundErrorSchema } from '../schemas/inspection.js';
import { ErrorResponseSchema } from '../schemas/common.js';

// Path parameter schema
const PhotoIdParam = z.object({
  id: z.string().uuid().openapi({ description: 'Photo ID' }),
});

// Query parameter schema
const PhotosQuerySchema = z.object({
  inspectionId: z.string().uuid().optional().openapi({ description: 'Filter by inspection ID' }),
  findingId: z.string().uuid().optional().openapi({ description: 'Filter by finding ID' }),
});

// Upload request schema
const PhotoUploadSchema = z.object({
  inspectionId: z.string().uuid().openapi({ description: 'Inspection ID' }),
  findingId: z.string().uuid().optional().openapi({ description: 'Associated finding ID' }),
  caption: z.string().optional().openapi({ description: 'Photo caption' }),
  data: z.string().openapi({ description: 'Base64 encoded image data' }),
}).openapi('PhotoUploadRequest');

// Photo list response
const PhotoListResponseSchema = z.array(PhotoResponseSchema).openapi('PhotoListResponse');

registry.register('PhotoUploadRequest', PhotoUploadSchema);
registry.register('PhotoListResponse', PhotoListResponseSchema);

// POST /api/photos - Upload photo
registry.registerPath({
  method: 'post',
  path: '/api/photos',
  summary: 'Upload a photo',
  description: 'Upload a photo and associate it with a finding or inspection.',
  tags: ['Photos'],
  request: {
    body: {
      content: {
        'application/json': { schema: PhotoUploadSchema },
      },
      required: true,
    },
  },
  responses: {
    201: {
      description: 'Photo uploaded successfully',
      content: {
        'application/json': { schema: PhotoUploadResponseSchema },
      },
    },
    400: {
      description: 'Validation error',
      content: {
        'application/json': { schema: ValidationErrorSchema },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': { schema: ErrorResponseSchema },
      },
    },
  },
});

// GET /api/photos - List photos
registry.registerPath({
  method: 'get',
  path: '/api/photos',
  summary: 'List photos',
  description: 'Retrieve photos, optionally filtered by inspection or finding.',
  tags: ['Photos'],
  request: {
    query: PhotosQuerySchema,
  },
  responses: {
    200: {
      description: 'List of photos',
      content: {
        'application/json': { schema: PhotoListResponseSchema },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': { schema: ErrorResponseSchema },
      },
    },
  },
});

// GET /api/photos/:id - Get photo by ID
registry.registerPath({
  method: 'get',
  path: '/api/photos/{id}',
  summary: 'Get photo by ID',
  description: 'Retrieve a specific photo.',
  tags: ['Photos'],
  request: {
    params: PhotoIdParam,
  },
  responses: {
    200: {
      description: 'Photo details',
      content: {
        'application/json': { schema: PhotoResponseSchema },
      },
    },
    404: {
      description: 'Photo not found',
      content: {
        'application/json': { schema: NotFoundErrorSchema },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': { schema: ErrorResponseSchema },
      },
    },
  },
});

// DELETE /api/photos/:id - Delete photo
registry.registerPath({
  method: 'delete',
  path: '/api/photos/{id}',
  summary: 'Delete photo',
  description: 'Delete an existing photo.',
  tags: ['Photos'],
  request: {
    params: PhotoIdParam,
  },
  responses: {
    204: {
      description: 'Photo deleted successfully',
    },
    404: {
      description: 'Photo not found',
      content: {
        'application/json': { schema: NotFoundErrorSchema },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': { schema: ErrorResponseSchema },
      },
    },
  },
});
