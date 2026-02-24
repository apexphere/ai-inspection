/**
 * OpenAPI Route Registration for Personnel & Credentials
 * Issue #498
 */

import { z } from '../setup.js';
import { registry } from '../registry.js';
import { ErrorResponseSchema } from '../schemas/common.js';

// ============================================
// Personnel Schemas
// ============================================

const PersonnelRoleEnum = z.enum([
  'REGISTERED_BUILDING_SURVEYOR',
  'BUILDING_SURVEYOR',
  'INSPECTOR',
  'ADMIN',
]);

const CreatePersonnelSchema = z.object({
  name: z.string().min(1).openapi({ example: 'Ian Fong' }),
  email: z.string().email().openapi({ example: 'ian@example.com' }),
  phone: z.string().optional().openapi({ example: '+64 9 123 4567' }),
  mobile: z.string().optional().openapi({ example: '+64 21 123 4567' }),
  role: PersonnelRoleEnum.openapi({ example: 'REGISTERED_BUILDING_SURVEYOR' }),
  companyId: z.string().uuid().optional().openapi({ description: 'Company FK' }),
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

const PersonnelListResponseSchema = z.array(PersonnelResponseSchema).openapi('PersonnelListResponse');

const CredentialsStringResponseSchema = z.object({
  personnelId: z.string().uuid(),
  name: z.string(),
  credentialsString: z.string().openapi({ example: 'Registered Building Surveyor, MNZIBS, BE (Hons), MBA' }),
}).openapi('CredentialsStringResponse');

// ============================================
// Credential Schemas
// ============================================

const CredentialTypeEnum = z.enum(['NZIBS', 'LBP', 'ENG_NZ', 'ACADEMIC', 'OTHER']);

const CreateCredentialSchema = z.object({
  credentialType: CredentialTypeEnum,
  membershipCode: z.string().optional().openapi({ example: 'MNZIBS' }),
  membershipFull: z.string().optional().openapi({ example: 'Member of NZ Institute of Building Surveyors' }),
  registrationTitle: z.string().optional().openapi({ example: 'Registered Building Surveyor' }),
  licenseNumber: z.string().optional(),
  qualifications: z.array(z.string()).optional().openapi({ example: ['BE (Hons)', 'MBA'] }),
  issuedDate: z.string().datetime().optional(),
  expiryDate: z.string().datetime().optional(),
  verified: z.boolean().optional(),
}).openapi('CreateCredentialRequest');

const UpdateCredentialSchema = z.object({
  credentialType: CredentialTypeEnum.optional(),
  membershipCode: z.string().nullable().optional(),
  membershipFull: z.string().nullable().optional(),
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

const AlertLevelEnum = z.enum(['EXPIRED', 'CRITICAL', 'WARNING', 'UPCOMING']);

const ExpiringCredentialResponseSchema = z.object({
  count: z.number(),
  thresholdDays: z.number(),
  credentials: z.array(z.object({
    credential: CredentialResponseSchema,
    alertLevel: AlertLevelEnum,
    daysUntilExpiry: z.number(),
  })),
}).openapi('ExpiringCredentialResponse');

const ExpirySummaryResponseSchema = z.object({
  expired: z.number(),
  critical: z.number(),
  warning: z.number(),
  upcoming: z.number(),
  total: z.number(),
}).openapi('ExpirySummaryResponse');

// Register schemas
registry.register('CreatePersonnelRequest', CreatePersonnelSchema);
registry.register('UpdatePersonnelRequest', UpdatePersonnelSchema);
registry.register('PersonnelResponse', PersonnelResponseSchema);
registry.register('CreateCredentialRequest', CreateCredentialSchema);
registry.register('UpdateCredentialRequest', UpdateCredentialSchema);
registry.register('CredentialResponse', CredentialResponseSchema);

// ============================================
// Personnel Routes
// ============================================

const personnelIdParam = z.object({
  id: z.string().uuid().openapi({ description: 'Personnel ID' }),
});

registry.registerPath({
  method: 'post',
  path: '/api/personnel',
  summary: 'Create personnel',
  tags: ['Personnel'],
  request: { body: { content: { 'application/json': { schema: CreatePersonnelSchema } } } },
  responses: {
    201: { description: 'Personnel created', content: { 'application/json': { schema: PersonnelResponseSchema } } },
    400: { description: 'Validation error', content: { 'application/json': { schema: ErrorResponseSchema } } },
    409: { description: 'Email conflict', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/personnel',
  summary: 'List personnel',
  tags: ['Personnel'],
  request: {
    query: z.object({
      role: PersonnelRoleEnum.optional(),
      active: z.string().optional().openapi({ description: '"true" or "false"' }),
      name: z.string().optional().openapi({ description: 'Filter by name (partial match)' }),
    }),
  },
  responses: {
    200: { description: 'List of personnel', content: { 'application/json': { schema: PersonnelListResponseSchema } } },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/personnel/authors',
  summary: 'List eligible report authors',
  description: 'Returns active personnel with authoring capability (REGISTERED_BUILDING_SURVEYOR, BUILDING_SURVEYOR).',
  tags: ['Personnel'],
  responses: {
    200: { description: 'Eligible authors', content: { 'application/json': { schema: PersonnelListResponseSchema } } },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/personnel/reviewers',
  summary: 'List eligible report reviewers',
  description: 'Returns active personnel with reviewing capability (REGISTERED_BUILDING_SURVEYOR only).',
  tags: ['Personnel'],
  responses: {
    200: { description: 'Eligible reviewers', content: { 'application/json': { schema: PersonnelListResponseSchema } } },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/personnel/{id}',
  summary: 'Get personnel by ID',
  tags: ['Personnel'],
  request: { params: personnelIdParam },
  responses: {
    200: { description: 'Personnel details', content: { 'application/json': { schema: PersonnelResponseSchema } } },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'put',
  path: '/api/personnel/{id}',
  summary: 'Update personnel',
  tags: ['Personnel'],
  request: {
    params: personnelIdParam,
    body: { content: { 'application/json': { schema: UpdatePersonnelSchema } } },
  },
  responses: {
    200: { description: 'Personnel updated', content: { 'application/json': { schema: PersonnelResponseSchema } } },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
    409: { description: 'Email conflict', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/personnel/{id}',
  summary: 'Deactivate personnel',
  description: 'Soft delete — sets active=false.',
  tags: ['Personnel'],
  request: { params: personnelIdParam },
  responses: {
    200: { description: 'Personnel deactivated', content: { 'application/json': { schema: PersonnelResponseSchema } } },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/personnel/{id}/credentials-string',
  summary: 'Get formatted credentials string',
  description: 'Returns a formatted credential string for report signature blocks.',
  tags: ['Personnel'],
  request: { params: personnelIdParam },
  responses: {
    200: { description: 'Formatted credentials', content: { 'application/json': { schema: CredentialsStringResponseSchema } } },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

// ============================================
// Credential Routes
// ============================================

const personnelIdPathParam = z.object({
  personnelId: z.string().uuid().openapi({ description: 'Personnel ID' }),
});

const credentialIdParam = z.object({
  id: z.string().uuid().openapi({ description: 'Credential ID' }),
});

registry.registerPath({
  method: 'get',
  path: '/api/credentials/expiring',
  summary: 'List expiring credentials',
  description: 'Returns credentials expiring within the specified threshold.',
  tags: ['Credentials'],
  request: {
    query: z.object({
      days: z.string().optional().openapi({ description: 'Days threshold (default 90)' }),
      personnelId: z.string().uuid().optional(),
      credentialType: CredentialTypeEnum.optional(),
      alertLevel: AlertLevelEnum.optional(),
    }),
  },
  responses: {
    200: { description: 'Expiring credentials', content: { 'application/json': { schema: ExpiringCredentialResponseSchema } } },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/credentials/expiring/summary',
  summary: 'Expiry alert summary',
  description: 'Returns counts by alert level (expired, critical, warning, upcoming).',
  tags: ['Credentials'],
  responses: {
    200: { description: 'Summary counts', content: { 'application/json': { schema: ExpirySummaryResponseSchema } } },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/personnel/{personnelId}/credentials',
  summary: 'Create credential for personnel',
  tags: ['Credentials'],
  request: {
    params: personnelIdPathParam,
    body: { content: { 'application/json': { schema: CreateCredentialSchema } } },
  },
  responses: {
    201: { description: 'Credential created', content: { 'application/json': { schema: CredentialResponseSchema } } },
    400: { description: 'Validation error', content: { 'application/json': { schema: ErrorResponseSchema } } },
    404: { description: 'Personnel not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/personnel/{personnelId}/credentials',
  summary: 'List credentials for personnel',
  tags: ['Credentials'],
  request: { params: personnelIdPathParam },
  responses: {
    200: { description: 'Credentials list', content: { 'application/json': { schema: CredentialListResponseSchema } } },
  },
});

registry.registerPath({
  method: 'put',
  path: '/api/credentials/{id}',
  summary: 'Update credential',
  tags: ['Credentials'],
  request: {
    params: credentialIdParam,
    body: { content: { 'application/json': { schema: UpdateCredentialSchema } } },
  },
  responses: {
    200: { description: 'Credential updated', content: { 'application/json': { schema: CredentialResponseSchema } } },
    400: { description: 'Validation error', content: { 'application/json': { schema: ErrorResponseSchema } } },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/credentials/{id}',
  summary: 'Delete credential',
  tags: ['Credentials'],
  request: { params: credentialIdParam },
  responses: {
    204: { description: 'Credential deleted' },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});
