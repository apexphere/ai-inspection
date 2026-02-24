/**
 * OpenAPI Route Registration for Companies
 * Issue #499
 */

import { z } from '../setup.js';
import { registry } from '../registry.js';
import { ErrorResponseSchema } from '../schemas/common.js';

// ============================================
// Schemas
// ============================================

const CreateCompanySchema = z.object({
  name: z.string().min(1).openapi({ example: 'Apex Inspection Services' }),
  address: z.string().optional().openapi({ example: '123 Queen Street, Auckland' }),
  phone: z.string().optional().openapi({ example: '+64 9 555 0100' }),
  email: z.string().email().optional().openapi({ example: 'info@apex.co.nz' }),
  website: z.string().url().optional().openapi({ example: 'https://apex.co.nz' }),
}).openapi('CreateCompanyRequest');

const UpdateCompanySchema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
}).openapi('UpdateCompanyRequest');

const CompanyResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  logoPath: z.string().nullable(),
  address: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  website: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).openapi('CompanyResponse');

const CompanyListResponseSchema = z.array(CompanyResponseSchema).openapi('CompanyListResponse');

const LogoUploadSchema = z.object({
  logoPath: z.string().min(1).openapi({ example: '/uploads/logos/apex-logo.png' }),
}).openapi('LogoUploadRequest');

registry.register('CreateCompanyRequest', CreateCompanySchema);
registry.register('UpdateCompanyRequest', UpdateCompanySchema);
registry.register('CompanyResponse', CompanyResponseSchema);

// ============================================
// Routes
// ============================================

const companyIdParam = z.object({
  id: z.string().uuid().openapi({ description: 'Company ID' }),
});

registry.registerPath({
  method: 'post',
  path: '/api/companies',
  summary: 'Create a company',
  tags: ['Companies'],
  request: { body: { content: { 'application/json': { schema: CreateCompanySchema } } } },
  responses: {
    201: { description: 'Company created', content: { 'application/json': { schema: CompanyResponseSchema } } },
    400: { description: 'Validation error', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/companies',
  summary: 'List all companies',
  tags: ['Companies'],
  responses: {
    200: { description: 'List of companies', content: { 'application/json': { schema: CompanyListResponseSchema } } },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/companies/{id}',
  summary: 'Get company by ID',
  tags: ['Companies'],
  request: { params: companyIdParam },
  responses: {
    200: { description: 'Company details', content: { 'application/json': { schema: CompanyResponseSchema } } },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'put',
  path: '/api/companies/{id}',
  summary: 'Update a company',
  tags: ['Companies'],
  request: {
    params: companyIdParam,
    body: { content: { 'application/json': { schema: UpdateCompanySchema } } },
  },
  responses: {
    200: { description: 'Company updated', content: { 'application/json': { schema: CompanyResponseSchema } } },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/companies/{id}',
  summary: 'Delete a company',
  tags: ['Companies'],
  request: { params: companyIdParam },
  responses: {
    204: { description: 'Company deleted' },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
    409: { description: 'Cannot delete — has linked personnel', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/companies/{id}/logo',
  summary: 'Upload company logo',
  description: 'Set the logo path for a company. File upload support coming later.',
  tags: ['Companies'],
  request: {
    params: companyIdParam,
    body: { content: { 'application/json': { schema: LogoUploadSchema } } },
  },
  responses: {
    200: { description: 'Logo updated', content: { 'application/json': { schema: CompanyResponseSchema } } },
    400: { description: 'Validation error', content: { 'application/json': { schema: ErrorResponseSchema } } },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});
