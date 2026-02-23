/**
 * OpenAPI Route Registration for Clients
 * Issue #431
 */

import { z } from '../setup.js';
import { registry } from '../registry.js';
import { ErrorResponseSchema } from '../schemas/common.js';

// ============================================
// Schemas
// ============================================

const CreateClientSchema = z.object({
  name: z.string().min(1).openapi({
    description: 'Client name',
    example: 'Sarah Johnson',
  }),
  email: z.string().email().optional().openapi({
    description: 'Client email',
    example: 'sarah@example.com',
  }),
  phone: z.string().optional().openapi({
    description: 'Client phone number',
    example: '+64 9 123 4567',
  }),
  mobile: z.string().optional().openapi({
    description: 'Client mobile number',
    example: '+64 21 123 4567',
  }),
  address: z.string().optional().openapi({
    description: 'Client address',
    example: '42 Oak Street, Ponsonby, Auckland',
  }),
  contactPerson: z.string().optional().openapi({
    description: 'Primary contact person',
    example: 'John Smith',
  }),
}).openapi('CreateClientRequest');

const UpdateClientSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  address: z.string().optional(),
  contactPerson: z.string().optional(),
}).openapi('UpdateClientRequest');

const ClientResponseSchema = z.object({
  id: z.string().uuid().openapi({
    description: 'Client ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  }),
  name: z.string().openapi({
    description: 'Client name',
    example: 'Sarah Johnson',
  }),
  email: z.string().nullable().openapi({
    description: 'Client email',
    example: 'sarah@example.com',
  }),
  phone: z.string().nullable(),
  mobile: z.string().nullable(),
  address: z.string().nullable(),
  contactPerson: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).openapi('ClientResponse');

const ClientListResponseSchema = z.array(ClientResponseSchema).openapi('ClientListResponse');

// Register schemas
registry.register('CreateClientRequest', CreateClientSchema);
registry.register('UpdateClientRequest', UpdateClientSchema);
registry.register('ClientResponse', ClientResponseSchema);
registry.register('ClientListResponse', ClientListResponseSchema);

// ============================================
// Routes
// ============================================

// POST /api/clients - Create client
registry.registerPath({
  method: 'post',
  path: '/api/clients',
  summary: 'Create a new client',
  description: 'Create a new client record for project association.',
  tags: ['Clients'],
  request: {
    body: {
      content: {
        'application/json': { schema: CreateClientSchema },
      },
    },
  },
  responses: {
    201: {
      description: 'Client created successfully',
      content: {
        'application/json': { schema: ClientResponseSchema },
      },
    },
    400: {
      description: 'Validation error',
      content: {
        'application/json': { schema: ErrorResponseSchema },
      },
    },
  },
});

// GET /api/clients - List clients
registry.registerPath({
  method: 'get',
  path: '/api/clients',
  summary: 'List all clients',
  description: 'Retrieve all clients with optional name filter.',
  tags: ['Clients'],
  request: {
    query: z.object({
      name: z.string().optional().openapi({ description: 'Filter by name (partial match)' }),
    }),
  },
  responses: {
    200: {
      description: 'List of clients',
      content: {
        'application/json': { schema: ClientListResponseSchema },
      },
    },
  },
});

// GET /api/clients/:id - Get client
registry.registerPath({
  method: 'get',
  path: '/api/clients/{id}',
  summary: 'Get client by ID',
  tags: ['Clients'],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: 'Client ID' }),
    }),
  },
  responses: {
    200: {
      description: 'Client details',
      content: {
        'application/json': { schema: ClientResponseSchema },
      },
    },
    404: {
      description: 'Client not found',
      content: {
        'application/json': { schema: ErrorResponseSchema },
      },
    },
  },
});

// PUT /api/clients/:id - Update client
registry.registerPath({
  method: 'put',
  path: '/api/clients/{id}',
  summary: 'Update a client',
  tags: ['Clients'],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: 'Client ID' }),
    }),
    body: {
      content: {
        'application/json': { schema: UpdateClientSchema },
      },
    },
  },
  responses: {
    200: {
      description: 'Client updated',
      content: {
        'application/json': { schema: ClientResponseSchema },
      },
    },
    404: {
      description: 'Client not found',
      content: {
        'application/json': { schema: ErrorResponseSchema },
      },
    },
  },
});

// DELETE /api/clients/:id - Delete client
registry.registerPath({
  method: 'delete',
  path: '/api/clients/{id}',
  summary: 'Delete a client',
  tags: ['Clients'],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: 'Client ID' }),
    }),
  },
  responses: {
    204: {
      description: 'Client deleted',
    },
    404: {
      description: 'Client not found',
      content: {
        'application/json': { schema: ErrorResponseSchema },
      },
    },
  },
});
