/**
 * OpenAPI Schemas for Photo Endpoints
 * Issue #429
 */

import { z } from '../setup.js';
import { registry } from '../registry.js';

// ============================================
// Response Schemas
// ============================================

export const PhotoResponseSchema = z.object({
  id: z.string().uuid().openapi({
    description: 'Photo ID',
    example: '550e8400-e29b-41d4-a716-446655440002',
  }),
  findingId: z.string().uuid().openapi({
    description: 'Associated finding ID',
  }),
  filename: z.string().openapi({
    description: 'Original filename',
    example: 'IMG_0123.jpg',
  }),
  path: z.string().openapi({
    description: 'Storage path or URL',
    example: '/photos/abc123.jpg',
  }),
  mimeType: z.string().openapi({
    description: 'MIME type of the image',
    example: 'image/jpeg',
  }),
  createdAt: z.string().datetime().openapi({
    description: 'Upload timestamp',
  }),
}).openapi('PhotoResponse');

export const PhotoUploadResponseSchema = z.object({
  id: z.string().uuid().openapi({
    description: 'Photo ID',
  }),
  filename: z.string().openapi({
    description: 'Stored filename',
  }),
  path: z.string().openapi({
    description: 'Storage path',
  }),
  url: z.string().url().optional().openapi({
    description: 'Public URL if available',
  }),
}).openapi('PhotoUploadResponse');

// ============================================
// Register Schemas
// ============================================

registry.register('PhotoResponse', PhotoResponseSchema);
registry.register('PhotoUploadResponse', PhotoUploadResponseSchema);

// ============================================
// Register Routes
// ============================================

registry.registerPath({
  method: 'post',
  path: '/api/photos',
  tags: ['Photos'],
  summary: 'Upload a photo',
  description: 'Upload a photo and associate it with a finding',
  request: {
    body: {
      content: {
        'multipart/form-data': {
          schema: z.object({
            file: z.any().openapi({
              description: 'Image file (JPEG, PNG)',
              type: 'string',
              format: 'binary',
            }),
            findingId: z.string().uuid().openapi({
              description: 'Finding to attach photo to',
            }),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Photo uploaded successfully',
      content: {
        'application/json': {
          schema: PhotoUploadResponseSchema,
        },
      },
    },
    400: {
      description: 'Invalid file or missing findingId',
    },
    413: {
      description: 'File too large (max 10MB)',
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/findings/{findingId}/photos',
  tags: ['Photos'],
  summary: 'List photos for a finding',
  request: {
    params: z.object({
      findingId: z.string().uuid().openapi({
        description: 'Finding ID',
      }),
    }),
  },
  responses: {
    200: {
      description: 'List of photos',
      content: {
        'application/json': {
          schema: z.array(PhotoResponseSchema),
        },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/photos/{id}',
  tags: ['Photos'],
  summary: 'Get photo by ID',
  request: {
    params: z.object({
      id: z.string().uuid().openapi({
        description: 'Photo ID',
      }),
    }),
  },
  responses: {
    200: {
      description: 'Photo details',
      content: {
        'application/json': {
          schema: PhotoResponseSchema,
        },
      },
    },
    404: {
      description: 'Photo not found',
    },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/photos/{id}',
  tags: ['Photos'],
  summary: 'Delete a photo',
  request: {
    params: z.object({
      id: z.string().uuid().openapi({
        description: 'Photo ID',
      }),
    }),
  },
  responses: {
    204: {
      description: 'Photo deleted successfully',
    },
    404: {
      description: 'Photo not found',
    },
  },
});
