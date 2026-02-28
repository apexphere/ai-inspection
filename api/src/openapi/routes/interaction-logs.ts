/**
 * OpenAPI Route Registration for Interaction Logs
 * Issue #512 - Interaction Observability
 */

import { z } from '../setup.js';
import { registry } from '../registry.js';

// Event type enum
const InteractionEventTypeSchema = z.enum([
  'USER_INPUT',
  'AI_INTERPRETATION',
  'TOOL_CALL',
  'TOOL_RESULT',
  'AI_RESPONSE',
]).openapi('InteractionEventType');

// Log entry schema
const InteractionLogSchema = z.object({
  id: z.string().uuid().openapi({ description: 'Log entry ID' }),
  sessionId: z.string().openapi({ description: 'Inspection session ID' }),
  timestamp: z.string().datetime().openapi({ description: 'Event timestamp' }),
  eventType: InteractionEventTypeSchema.openapi({ description: 'Type of interaction event' }),
  content: z.record(z.unknown()).openapi({ description: 'Event payload' }),
  metadata: z.record(z.unknown()).nullable().openapi({ description: 'Additional context' }),
}).openapi('InteractionLog');

// Create log request schema
const CreateInteractionLogSchema = z.object({
  sessionId: z.string().openapi({ description: 'Inspection session ID', example: 'insp-123' }),
  eventType: InteractionEventTypeSchema,
  content: z.record(z.unknown()).openapi({ 
    description: 'Event payload',
    example: { text: 'Starting inspection at 42 Smith Street' },
  }),
  metadata: z.record(z.unknown()).optional().openapi({ 
    description: 'Additional context',
    example: { channel: 'whatsapp', userId: 'user-456' },
  }),
}).openapi('CreateInteractionLog');

// Batch create request schema
const BatchCreateInteractionLogSchema = z.object({
  logs: z.array(CreateInteractionLogSchema).min(1).max(100).openapi({
    description: 'Array of log entries to create',
  }),
}).openapi('BatchCreateInteractionLog');

// Query response schema
const InteractionLogListSchema = z.object({
  logs: z.array(InteractionLogSchema),
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
}).openapi('InteractionLogList');

// Session timeline response schema
const SessionTimelineSchema = z.object({
  sessionId: z.string(),
  logs: z.array(InteractionLogSchema),
  count: z.number(),
}).openapi('SessionTimeline');

// Error response
const ErrorResponseSchema = z.object({
  error: z.string(),
  details: z.record(z.array(z.string())).optional(),
}).openapi('InteractionLogError');

// Register schemas
registry.register('InteractionEventType', InteractionEventTypeSchema);
registry.register('InteractionLog', InteractionLogSchema);
registry.register('CreateInteractionLog', CreateInteractionLogSchema);
registry.register('BatchCreateInteractionLog', BatchCreateInteractionLogSchema);
registry.register('InteractionLogList', InteractionLogListSchema);
registry.register('SessionTimeline', SessionTimelineSchema);

// POST /api/interaction-logs - Create single log entry
registry.registerPath({
  method: 'post',
  path: '/api/interaction-logs',
  summary: 'Create interaction log',
  description: 'Log a single interaction event. Service authentication required.',
  tags: ['Interaction Logs'],
  security: [{ apiKey: [] }],
  request: {
    body: {
      content: {
        'application/json': { schema: CreateInteractionLogSchema },
      },
      required: true,
    },
  },
  responses: {
    201: {
      description: 'Log entry created',
      content: {
        'application/json': { schema: InteractionLogSchema },
      },
    },
    400: {
      description: 'Validation error',
      content: {
        'application/json': { schema: ErrorResponseSchema },
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

// POST /api/interaction-logs/batch - Create multiple log entries
registry.registerPath({
  method: 'post',
  path: '/api/interaction-logs/batch',
  summary: 'Batch create interaction logs',
  description: 'Log multiple interaction events in a single request. Service authentication required.',
  tags: ['Interaction Logs'],
  security: [{ apiKey: [] }],
  request: {
    body: {
      content: {
        'application/json': { schema: BatchCreateInteractionLogSchema },
      },
      required: true,
    },
  },
  responses: {
    201: {
      description: 'Log entries created',
      content: {
        'application/json': { 
          schema: z.object({ created: z.number() }),
        },
      },
    },
    400: {
      description: 'Validation error',
      content: {
        'application/json': { schema: ErrorResponseSchema },
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

// GET /api/interaction-logs - Query logs
registry.registerPath({
  method: 'get',
  path: '/api/interaction-logs',
  summary: 'Query interaction logs',
  description: 'Query interaction logs with optional filters. Service authentication required.',
  tags: ['Interaction Logs'],
  security: [{ apiKey: [] }],
  request: {
    query: z.object({
      sessionId: z.string().optional().openapi({ description: 'Filter by session ID' }),
      eventType: InteractionEventTypeSchema.optional().openapi({ description: 'Filter by event type' }),
      from: z.string().datetime().optional().openapi({ description: 'Start timestamp' }),
      to: z.string().datetime().optional().openapi({ description: 'End timestamp' }),
      limit: z.coerce.number().min(1).max(1000).default(100).openapi({ description: 'Max results' }),
      offset: z.coerce.number().min(0).default(0).openapi({ description: 'Skip results' }),
    }),
  },
  responses: {
    200: {
      description: 'List of interaction logs',
      content: {
        'application/json': { schema: InteractionLogListSchema },
      },
    },
    400: {
      description: 'Validation error',
      content: {
        'application/json': { schema: ErrorResponseSchema },
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

// GET /api/interaction-logs/sessions/:sessionId - Get session timeline
registry.registerPath({
  method: 'get',
  path: '/api/interaction-logs/sessions/{sessionId}',
  summary: 'Get session timeline',
  description: 'Get all interaction logs for a session in chronological order. Service authentication required.',
  tags: ['Interaction Logs'],
  security: [{ apiKey: [] }],
  request: {
    params: z.object({
      sessionId: z.string().openapi({ description: 'Session ID' }),
    }),
  },
  responses: {
    200: {
      description: 'Session timeline',
      content: {
        'application/json': { schema: SessionTimelineSchema },
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
