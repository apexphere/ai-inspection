/**
 * OpenAPI Route Registration for Personnel
 * Issue #497
 */

import { z } from '../setup.js';
import { registry } from '../registry.js';
import { ErrorResponseSchema } from '../schemas/common.js';
import { BadRequestErrorSchema, ConflictErrorSchema } from '../schemas/errors.js';

// ============================================
// Schemas
// ============================================

const PersonnelRoleEnum = z.enum([
  'REGISTERED_BUILDING_SURVEYOR',
  'BUILDING_SURVEYOR',
  'INSPECTOR',
  'ADMIN',
]);

const CreatePersonnelSchema = z.object({
  name: z.string().min(1).openapi({
    description: 'Personnel name',
    example: 'John Smith',
  }),
  email: z.string().email().openapi({
    description: 'Personnel email',
    example: 'john.smith@acme-inspections.co.nz',
  }),
  phone: z.string().optional().openapi({
    description: 'Phone number',
    example: '+64 9 123 4567',
  }),
  mobile: z.string().optional().openapi({
    description: 'Mobile number',
    example: '+64 21 123 4567',
  }),
  role: PersonnelRoleEnum.openapi({
    description: 'Personnel role',
    example: 'BUILDING_SURVEYOR',
  }),
  companyId: z.string().uuid().optional().openapi({
    description: 'Company ID',
  }),
}).openapi('CreatePersonnelRequest');

const UpdatePersonnelSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  role: PersonnelRoleEnum.optional(),
  active: z.boolean().optional(),
  companyId: z.string().uuid().nullable().optional(),
}).openapi('UpdatePersonnelRequest');

const CredentialSchema = z.object({
  id: z.string().uuid(),
  credentialType: z.enum(['NZIBS', 'LBP', 'ENG_NZ', 'ACADEMIC', 'OTHER']),
  membershipCode: z.string().nullable(),
  membershipFull: z.string().nullable(),
  registrationTitle: z.string().nullable(),
  licenseNumber: z.string().nullable(),
  qualifications: z.array(z.string()),
  expiryDate: z.string().datetime().nullable(),
  verified: z.boolean(),
}).openapi('PersonnelCredential');

const PersonnelResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  mobile: z.string().nullable(),
  role: PersonnelRoleEnum,
  active: z.boolean(),
  companyId: z.string().uuid().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).openapi('PersonnelResponse');

const PersonnelWithCredentialsSchema = PersonnelResponseSchema.extend({
  credentials: z.array(CredentialSchema),
}).openapi('PersonnelWithCredentials');

const PersonnelListSchema = z.array(PersonnelResponseSchema).openapi('PersonnelList');

const PersonnelWithCredentialsListSchema = z.array(PersonnelWithCredentialsSchema).openapi('PersonnelWithCredentialsList');

const CredentialsStringResponseSchema = z.object({
  personnelId: z.string().uuid(),
  name: z.string(),
  credentialsString: z.string().openapi({
    description: 'Formatted credentials string',
    example: 'LBP, NZIBS, BSc',
  }),
}).openapi('CredentialsStringResponse');

// ============================================
// Routes
// ============================================

// POST /api/personnel - Create personnel
registry.registerPath({
  method: 'post',
  path: '/api/personnel',
  summary: 'Create a new personnel record',
  tags: ['Personnel'],
  request: {
    body: {
      content: {
        'application/json': { schema: CreatePersonnelSchema },
      },
    },
  },
  responses: {
    201: {
      description: 'Personnel created',
      content: {
        'application/json': { schema: PersonnelResponseSchema },
      },
    },
    400: {
      description: 'Validation error',
      content: {
        'application/json': { schema: BadRequestErrorSchema },
      },
    },
    409: {
      description: 'Email already exists',
      content: {
        'application/json': { schema: ConflictErrorSchema },
      },
    },
  },
});

// GET /api/personnel - List personnel
registry.registerPath({
  method: 'get',
  path: '/api/personnel',
  summary: 'List personnel',
  description: 'List all personnel with optional filters',
  tags: ['Personnel'],
  request: {
    query: z.object({
      role: PersonnelRoleEnum.optional().openapi({ description: 'Filter by role' }),
      active: z.string().optional().openapi({ description: 'Filter by active status (true/false)' }),
      name: z.string().optional().openapi({ description: 'Filter by name (partial match)' }),
    }),
  },
  responses: {
    200: {
      description: 'List of personnel',
      content: {
        'application/json': { schema: PersonnelListSchema },
      },
    },
  },
});

// GET /api/personnel/authors - List authors
registry.registerPath({
  method: 'get',
  path: '/api/personnel/authors',
  summary: 'List personnel eligible to author reports',
  description: 'Returns active personnel with roles that can author reports',
  tags: ['Personnel'],
  responses: {
    200: {
      description: 'List of authors with credentials',
      content: {
        'application/json': { schema: PersonnelWithCredentialsListSchema },
      },
    },
  },
});

// GET /api/personnel/reviewers - List reviewers
registry.registerPath({
  method: 'get',
  path: '/api/personnel/reviewers',
  summary: 'List personnel eligible to review reports',
  description: 'Returns active personnel with roles that can review reports',
  tags: ['Personnel'],
  responses: {
    200: {
      description: 'List of reviewers with credentials',
      content: {
        'application/json': { schema: PersonnelWithCredentialsListSchema },
      },
    },
  },
});

// GET /api/personnel/:id - Get personnel by ID
registry.registerPath({
  method: 'get',
  path: '/api/personnel/{id}',
  summary: 'Get personnel by ID',
  tags: ['Personnel'],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: 'Personnel ID' }),
    }),
  },
  responses: {
    200: {
      description: 'Personnel details',
      content: {
        'application/json': { schema: PersonnelResponseSchema },
      },
    },
    404: {
      description: 'Personnel not found',
      content: {
        'application/json': { schema: ErrorResponseSchema },
      },
    },
  },
});

// PUT /api/personnel/:id - Update personnel
registry.registerPath({
  method: 'put',
  path: '/api/personnel/{id}',
  summary: 'Update personnel',
  tags: ['Personnel'],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: 'Personnel ID' }),
    }),
    body: {
      content: {
        'application/json': { schema: UpdatePersonnelSchema },
      },
    },
  },
  responses: {
    200: {
      description: 'Personnel updated',
      content: {
        'application/json': { schema: PersonnelResponseSchema },
      },
    },
    400: {
      description: 'Validation error',
      content: {
        'application/json': { schema: BadRequestErrorSchema },
      },
    },
    404: {
      description: 'Personnel not found',
      content: {
        'application/json': { schema: ErrorResponseSchema },
      },
    },
    409: {
      description: 'Email already exists',
      content: {
        'application/json': { schema: ConflictErrorSchema },
      },
    },
  },
});

// DELETE /api/personnel/:id - Deactivate personnel
registry.registerPath({
  method: 'delete',
  path: '/api/personnel/{id}',
  summary: 'Deactivate personnel',
  description: 'Soft delete - sets active to false',
  tags: ['Personnel'],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: 'Personnel ID' }),
    }),
  },
  responses: {
    200: {
      description: 'Personnel deactivated',
      content: {
        'application/json': { schema: PersonnelResponseSchema },
      },
    },
    404: {
      description: 'Personnel not found',
      content: {
        'application/json': { schema: ErrorResponseSchema },
      },
    },
  },
});

// GET /api/personnel/:id/credentials-string - Get formatted credentials string
registry.registerPath({
  method: 'get',
  path: '/api/personnel/{id}/credentials-string',
  summary: 'Get formatted credentials string',
  description: 'Returns a formatted string of all credentials for display',
  tags: ['Personnel'],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: 'Personnel ID' }),
    }),
  },
  responses: {
    200: {
      description: 'Credentials string',
      content: {
        'application/json': { schema: CredentialsStringResponseSchema },
      },
    },
    404: {
      description: 'Personnel not found',
      content: {
        'application/json': { schema: ErrorResponseSchema },
      },
    },
  },
});
