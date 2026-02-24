/**
 * OpenAPI Route Registration for Credentials
 * Issue #497
 */

import { z } from '../setup.js';
import { registry } from '../registry.js';
import { ErrorResponseSchema } from '../schemas/common.js';
import { BadRequestErrorSchema } from '../schemas/errors.js';

// ============================================
// Schemas
// ============================================

const CredentialTypeEnum = z.enum(['NZIBS', 'LBP', 'ENG_NZ', 'ACADEMIC', 'OTHER']);

const CreateCredentialSchema = z.object({
  credentialType: CredentialTypeEnum.openapi({
    description: 'Type of credential',
    example: 'LBP',
  }),
  membershipCode: z.string().optional().openapi({
    description: 'Membership code',
    example: 'NZIBS-12345',
  }),
  registrationTitle: z.string().optional().openapi({
    description: 'Registration title',
    example: 'Licensed Building Practitioner',
  }),
  licenseNumber: z.string().optional().openapi({
    description: 'License number',
    example: 'BP123456',
  }),
  qualifications: z.array(z.string()).optional().openapi({
    description: 'List of qualifications',
    example: ['Design 2', 'Site 2'],
  }),
  issuedDate: z.string().datetime().optional().openapi({
    description: 'Date credential was issued',
    example: '2023-01-15T00:00:00.000Z',
  }),
  expiryDate: z.string().datetime().optional().openapi({
    description: 'Date credential expires',
    example: '2025-01-15T00:00:00.000Z',
  }),
  verified: z.boolean().optional().openapi({
    description: 'Whether credential has been verified',
    example: true,
  }),
}).openapi('CreateCredentialRequest');

const UpdateCredentialSchema = z.object({
  credentialType: CredentialTypeEnum.optional(),
  membershipCode: z.string().nullable().optional(),
  registrationTitle: z.string().nullable().optional(),
  licenseNumber: z.string().nullable().optional(),
  qualifications: z.array(z.string()).optional(),
  issuedDate: z.string().datetime().nullable().optional(),
  expiryDate: z.string().datetime().nullable().optional(),
  verified: z.boolean().optional(),
}).openapi('UpdateCredentialRequest');

const CredentialResponseSchema = z.object({
  id: z.string().uuid(),
  personnelId: z.string().uuid(),
  credentialType: CredentialTypeEnum,
  membershipCode: z.string().nullable(),
  membershipFull: z.string().nullable(),
  registrationTitle: z.string().nullable(),
  licenseNumber: z.string().nullable(),
  qualifications: z.array(z.string()),
  issuedDate: z.string().datetime().nullable(),
  expiryDate: z.string().datetime().nullable(),
  verified: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).openapi('CredentialResponse');

const CredentialListResponseSchema = z.array(CredentialResponseSchema).openapi('CredentialListResponse');

const AlertLevelEnum = z.enum(['CRITICAL', 'WARNING', 'UPCOMING']);

const ExpiringCredentialSchema = z.object({
  id: z.string().uuid(),
  personnelId: z.string().uuid(),
  personnelName: z.string(),
  credentialType: CredentialTypeEnum,
  expiryDate: z.string().datetime(),
  daysUntilExpiry: z.number().int(),
  alertLevel: AlertLevelEnum,
}).openapi('ExpiringCredential');

const ExpiringCredentialsResponseSchema = z.object({
  count: z.number().int(),
  thresholdDays: z.number().int(),
  credentials: z.array(ExpiringCredentialSchema),
}).openapi('ExpiringCredentialsResponse');

const ExpirySummaryResponseSchema = z.object({
  critical: z.number().int().openapi({ description: 'Credentials expiring within 30 days' }),
  warning: z.number().int().openapi({ description: 'Credentials expiring within 60 days' }),
  upcoming: z.number().int().openapi({ description: 'Credentials expiring within 90 days' }),
  total: z.number().int(),
}).openapi('ExpirySummaryResponse');

// ============================================
// Routes
// ============================================

// GET /api/credentials/expiring - List expiring credentials
registry.registerPath({
  method: 'get',
  path: '/api/credentials/expiring',
  summary: 'List expiring credentials',
  description: 'Get credentials that are expiring within the specified number of days',
  tags: ['Credentials'],
  request: {
    query: z.object({
      days: z.string().optional().openapi({ description: 'Days threshold (default: 90)' }),
      personnelId: z.string().uuid().optional().openapi({ description: 'Filter by personnel ID' }),
      credentialType: CredentialTypeEnum.optional().openapi({ description: 'Filter by credential type' }),
      alertLevel: AlertLevelEnum.optional().openapi({ description: 'Filter by alert level' }),
    }),
  },
  responses: {
    200: {
      description: 'List of expiring credentials',
      content: {
        'application/json': { schema: ExpiringCredentialsResponseSchema },
      },
    },
    400: {
      description: 'Invalid parameters',
      content: {
        'application/json': { schema: BadRequestErrorSchema },
      },
    },
  },
});

// GET /api/credentials/expiring/summary - Summary counts by alert level
registry.registerPath({
  method: 'get',
  path: '/api/credentials/expiring/summary',
  summary: 'Get expiring credentials summary',
  description: 'Get summary counts of expiring credentials by alert level',
  tags: ['Credentials'],
  request: {
    query: z.object({
      days: z.string().optional().openapi({ description: 'Days threshold (default: 90)' }),
    }),
  },
  responses: {
    200: {
      description: 'Expiry summary',
      content: {
        'application/json': { schema: ExpirySummaryResponseSchema },
      },
    },
  },
});

// POST /api/personnel/:personnelId/credentials - Create credential
registry.registerPath({
  method: 'post',
  path: '/api/personnel/{personnelId}/credentials',
  summary: 'Create a credential for personnel',
  tags: ['Credentials'],
  request: {
    params: z.object({
      personnelId: z.string().uuid().openapi({ description: 'Personnel ID' }),
    }),
    body: {
      content: {
        'application/json': { schema: CreateCredentialSchema },
      },
    },
  },
  responses: {
    201: {
      description: 'Credential created',
      content: {
        'application/json': { schema: CredentialResponseSchema },
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
  },
});

// GET /api/personnel/:personnelId/credentials - List credentials for personnel
registry.registerPath({
  method: 'get',
  path: '/api/personnel/{personnelId}/credentials',
  summary: 'List credentials for personnel',
  tags: ['Credentials'],
  request: {
    params: z.object({
      personnelId: z.string().uuid().openapi({ description: 'Personnel ID' }),
    }),
  },
  responses: {
    200: {
      description: 'List of credentials',
      content: {
        'application/json': { schema: CredentialListResponseSchema },
      },
    },
  },
});

// PUT /api/credentials/:id - Update credential
registry.registerPath({
  method: 'put',
  path: '/api/credentials/{id}',
  summary: 'Update a credential',
  tags: ['Credentials'],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: 'Credential ID' }),
    }),
    body: {
      content: {
        'application/json': { schema: UpdateCredentialSchema },
      },
    },
  },
  responses: {
    200: {
      description: 'Credential updated',
      content: {
        'application/json': { schema: CredentialResponseSchema },
      },
    },
    400: {
      description: 'Validation error',
      content: {
        'application/json': { schema: BadRequestErrorSchema },
      },
    },
    404: {
      description: 'Credential not found',
      content: {
        'application/json': { schema: ErrorResponseSchema },
      },
    },
  },
});

// DELETE /api/credentials/:id - Delete credential
registry.registerPath({
  method: 'delete',
  path: '/api/credentials/{id}',
  summary: 'Delete a credential',
  tags: ['Credentials'],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: 'Credential ID' }),
    }),
  },
  responses: {
    204: {
      description: 'Credential deleted',
    },
    404: {
      description: 'Credential not found',
      content: {
        'application/json': { schema: ErrorResponseSchema },
      },
    },
  },
});
