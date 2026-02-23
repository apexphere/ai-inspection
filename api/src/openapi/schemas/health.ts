/**
 * OpenAPI Schemas for Health Endpoints
 * Issue #431
 */

import { z } from '../setup.js';
import { registry } from '../registry.js';

// ============================================
// Response Schemas
// ============================================

export const HealthResponseSchema = z.object({
  status: z.enum(['ok', 'error']).openapi({
    description: 'Health status',
    example: 'ok',
  }),
  version: z.string().optional().openapi({
    description: 'Git commit SHA',
    example: 'abc123',
  }),
  branch: z.string().optional().openapi({
    description: 'Git branch name',
    example: 'develop',
  }),
  timestamp: z.string().datetime().openapi({
    description: 'Current server timestamp',
    example: '2026-02-23T10:00:00Z',
  }),
}).openapi('HealthResponse');

// ============================================
// Register Schemas
// ============================================

registry.register('HealthResponse', HealthResponseSchema);

// ============================================
// Register Routes
// ============================================

registry.registerPath({
  method: 'get',
  path: '/health',
  tags: ['Health'],
  summary: 'Health check endpoint',
  description: 'Returns server health status and version info',
  responses: {
    200: {
      description: 'Server is healthy',
      content: {
        'application/json': {
          schema: HealthResponseSchema,
        },
      },
    },
  },
});
