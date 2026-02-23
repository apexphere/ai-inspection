/**
 * OpenAPI Route Registration for Inspectors
 * Issue #431
 */

import { z } from '../setup.js';
import { registry } from '../registry.js';
import { ErrorResponseSchema } from '../schemas/common.js';

// ============================================
// Schemas
// ============================================

const InspectorResponseSchema = z.object({
  id: z.string().uuid().openapi({
    description: 'Inspector (user) ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
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

const InspectorNotFoundSchema = z.object({
  error: z.string().openapi({
    description: 'Error message',
    example: 'Inspector not found',
  }),
  message: z.string().openapi({
    description: 'User-friendly message for WhatsApp response',
    example: "I don't have you registered. Contact admin to set up your profile.",
  }),
}).openapi('InspectorNotFoundError');

// Register schemas
registry.register('InspectorResponse', InspectorResponseSchema);
registry.register('InspectorNotFoundError', InspectorNotFoundSchema);

// ============================================
// Routes
// ============================================

// GET /api/inspectors/by-phone/:phone - Lookup inspector by phone
registry.registerPath({
  method: 'get',
  path: '/api/inspectors/by-phone/{phone}',
  summary: 'Look up inspector by phone number',
  description: `Used by WhatsApp agent to identify which inspector is messaging.

**Authentication:** Requires X-API-Key header (service auth) or JWT token.

**Phone format:** E.164 format with + prefix (URL encoded as %2B).`,
  tags: ['Inspectors'],
  security: [{ apiKey: [] }, { bearerAuth: [] }],
  request: {
    params: z.object({
      phone: z.string().openapi({
        description: 'Phone number in E.164 format (URL encoded)',
        example: '%2B64211234567',
      }),
    }),
  },
  responses: {
    200: {
      description: 'Inspector found',
      content: {
        'application/json': { schema: InspectorResponseSchema },
      },
    },
    400: {
      description: 'Invalid phone number format',
      content: {
        'application/json': { schema: ErrorResponseSchema },
      },
    },
    401: {
      description: 'Authentication required',
      content: {
        'application/json': { schema: ErrorResponseSchema },
      },
    },
    404: {
      description: 'Inspector not found',
      content: {
        'application/json': { schema: InspectorNotFoundSchema },
      },
    },
  },
});
