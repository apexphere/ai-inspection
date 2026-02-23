/**
 * OpenAPI Schemas for Client Endpoints
 * Issue #431
 */

import { z } from '../setup.js';
import { registry } from '../registry.js';

// ============================================
// Request Schemas
// ============================================

export const CreateClientSchema = z.object({
  name: z.string().min(1).openapi({
    description: 'Client name',
    example: 'John Smith',
  }),
  email: z.string().email().optional().openapi({
    description: 'Client email',
    example: 'john@example.com',
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
    example: '123 Main Street, Auckland',
  }),
  contactPerson: z.string().optional().openapi({
    description: 'Primary contact person',
    example: 'Jane Smith',
  }),
}).openapi('CreateClientRequest');

export const UpdateClientSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  address: z.string().optional(),
  contactPerson: z.string().optional(),
}).openapi('UpdateClientRequest');

// ============================================
// Response Schemas
// ============================================

export const ClientResponseSchema = z.object({
  id: z.string().uuid().openapi({
    description: 'Client ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  }),
  name: z.string().openapi({
    description: 'Client name',
    example: 'John Smith',
  }),
  email: z.string().nullable().openapi({
    description: 'Client email',
    example: 'john@example.com',
  }),
  phone: z.string().nullable().openapi({
    description: 'Client phone',
  }),
  mobile: z.string().nullable().openapi({
    description: 'Client mobile',
  }),
  address: z.string().nullable().openapi({
    description: 'Client address',
  }),
  contactPerson: z.string().nullable().openapi({
    description: 'Primary contact person',
  }),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).openapi('ClientResponse');

export const ClientListResponseSchema = z.array(ClientResponseSchema).openapi('ClientListResponse');

// ============================================
// Register Schemas
// ============================================

registry.register('CreateClientRequest', CreateClientSchema);
registry.register('UpdateClientRequest', UpdateClientSchema);
registry.register('ClientResponse', ClientResponseSchema);
registry.register('ClientListResponse', ClientListResponseSchema);

// ============================================
// Register Routes
// ============================================

registry.registerPath({
  method: 'post',
  path: '/api/clients',
  tags: ['Clients'],
  summary: 'Create a new client',
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateClientSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Client created successfully',
      content: {
        'application/json': {
          schema: ClientResponseSchema,
        },
      },
    },
    400: {
      description: 'Validation error',
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/clients',
  tags: ['Clients'],
  summary: 'List all clients',
  request: {
    query: z.object({
      name: z.string().optional().openapi({ description: 'Filter by name (partial match)' }),
    }),
  },
  responses: {
    200: {
      description: 'List of clients',
      content: {
        'application/json': {
          schema: ClientListResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/clients/{id}',
  tags: ['Clients'],
  summary: 'Get client by ID',
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: 'Client ID' }),
    }),
  },
  responses: {
    200: {
      description: 'Client details',
      content: {
        'application/json': {
          schema: ClientResponseSchema,
        },
      },
    },
    404: {
      description: 'Client not found',
    },
  },
});

registry.registerPath({
  method: 'put',
  path: '/api/clients/{id}',
  tags: ['Clients'],
  summary: 'Update a client',
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: 'Client ID' }),
    }),
    body: {
      content: {
        'application/json': {
          schema: UpdateClientSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Client updated',
      content: {
        'application/json': {
          schema: ClientResponseSchema,
        },
      },
    },
    404: {
      description: 'Client not found',
    },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/clients/{id}',
  tags: ['Clients'],
  summary: 'Delete a client',
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
    },
  },
});
