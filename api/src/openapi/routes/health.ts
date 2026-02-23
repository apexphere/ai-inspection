/**
 * OpenAPI Route Registration for Health Check
 * Issue #431
 */

import { z } from '../setup.js';
import { registry } from '../registry.js';

// Health check response schema
const HealthResponseSchema = z.object({
  status: z.enum(['ok', 'degraded', 'error']).openapi({
    description: 'Service health status',
    example: 'ok',
  }),
  version: z.string().optional().openapi({
    description: 'Git commit SHA',
    example: 'abc1234',
  }),
  database: z.enum(['connected', 'disconnected']).optional().openapi({
    description: 'Database connection status',
    example: 'connected',
  }),
  timestamp: z.string().datetime().optional().openapi({
    description: 'Current server time',
    example: '2026-02-23T19:30:00.000Z',
  }),
}).openapi('HealthResponse');

registry.register('HealthResponse', HealthResponseSchema);

// GET /health - Health check
registry.registerPath({
  method: 'get',
  path: '/health',
  summary: 'Health check',
  description: 'Check the health status of the API service.',
  tags: ['Health'],
  responses: {
    200: {
      description: 'Service is healthy',
      content: {
        'application/json': { schema: HealthResponseSchema },
      },
    },
    503: {
      description: 'Service is unhealthy',
      content: {
        'application/json': { schema: HealthResponseSchema },
      },
    },
  },
});
