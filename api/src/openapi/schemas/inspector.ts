/**
 * OpenAPI Schemas for Inspector Endpoints
 * Issue #431
 */

import { z } from '../setup.js';
import { registry } from '../registry.js';

// ============================================
// Response Schemas
// ============================================

export const InspectorResponseSchema = z.object({
  id: z.string().uuid().openapi({
    description: 'Inspector (user) ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  }),
  name: z.string().nullable().openapi({
    description: 'Inspector name',
    example: 'Jake Li',
  }),
  email: z.string().openapi({
    description: 'Inspector email',
    example: 'jake@example.com',
  }),
}).openapi('InspectorResponse');

export const InspectorNotFoundSchema = z.object({
  error: z.string().openapi({
    description: 'Error message',
    example: 'Inspector not found',
  }),
  message: z.string().openapi({
    description: 'User-friendly message',
    example: "I don't have you registered. Contact admin to set up your profile.",
  }),
}).openapi('InspectorNotFoundError');

// ============================================
// Register Schemas
// ============================================

registry.register('InspectorResponse', InspectorResponseSchema);
registry.register('InspectorNotFoundError', InspectorNotFoundSchema);

// ============================================
// Register Routes
// ============================================

registry.registerPath({
  method: 'get',
  path: '/api/inspectors/by-phone/{phone}',
  tags: ['Inspectors'],
  summary: 'Look up inspector by phone number',
  description: 'Used by WhatsApp agent to identify which inspector is messaging. Requires service API key authentication.',
  request: {
    params: z.object({
      phone: z.string().openapi({
        description: 'Phone number in E.164 format (URL encoded)',
        example: '+64211234567',
      }),
    }),
  },
  responses: {
    200: {
      description: 'Inspector found',
      content: {
        'application/json': {
          schema: InspectorResponseSchema,
        },
      },
    },
    400: {
      description: 'Invalid phone number format',
    },
    401: {
      description: 'Authentication required',
    },
    404: {
      description: 'Inspector not found',
      content: {
        'application/json': {
          schema: InspectorNotFoundSchema,
        },
      },
    },
  },
});
