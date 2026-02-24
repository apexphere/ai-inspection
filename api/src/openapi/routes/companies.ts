/**
 * OpenAPI Route Registration for Companies
 * Issue #497
 */

import { z } from '../setup.js';
import { registry } from '../registry.js';
import { ErrorResponseSchema } from '../schemas/common.js';
import { BadRequestErrorSchema, ConflictErrorSchema } from '../schemas/errors.js';

// ============================================
// Schemas
// ============================================

const CreateCompanySchema = z.object({
  name: z.string().min(1).openapi({
    description: 'Company name',
    example: 'Acme Building Inspections Ltd',
  }),
  address: z.string().optional().openapi({
    description: 'Company address',
    example: '123 Main Street, Auckland 1010',
  }),
  phone: z.string().optional().openapi({
    description: 'Company phone number',
    example: '+64 9 123 4567',
  }),
  email: z.string().email().optional().openapi({
    description: 'Company email',
    example: 'info@acme-inspections.co.nz',
  }),
  website: z.string().url().optional().openapi({
    description: 'Company website',
    example: 'https://acme-inspections.co.nz',
  }),
}).openapi('CreateCompanyRequest');

const UpdateCompanySchema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
}).openapi('UpdateCompanyRequest');

const CompanyResponseSchema = z.object({
  id: z.string().uuid().openapi({
    description: 'Company ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  }),
  name: z.string(),
  address: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  website: z.string().nullable(),
  logoPath: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).openapi('CompanyResponse');

const CompanyListResponseSchema = z.array(CompanyResponseSchema).openapi('CompanyListResponse');

const UpdateLogoRequestSchema = z.object({
  logoPath: z.string().min(1).openapi({
    description: 'Path to logo file',
    example: '/uploads/logos/company-logo.png',
  }),
}).openapi('UpdateLogoRequest');

// Register schemas
registry.register('CreateCompanyRequest', CreateCompanySchema);
registry.register('UpdateCompanyRequest', UpdateCompanySchema);
registry.register('CompanyResponse', CompanyResponseSchema);
registry.register('CompanyListResponse', CompanyListResponseSchema);

// ============================================
// Routes
// ============================================

// POST /api/companies - Create company
registry.registerPath({
  method: 'post',
  path: '/api/companies',
  summary: 'Create a new company',
  tags: ['Companies'],
  request: {
    body: {
      content: {
        'application/json': { schema: CreateCompanySchema },
      },
    },
  },
  responses: {
    201: {
      description: 'Company created successfully',
      content: {
        'application/json': { schema: CompanyResponseSchema },
      },
    },
    400: {
      description: 'Validation error',
      content: {
        'application/json': { schema: BadRequestErrorSchema },
      },
    },
  },
});

// GET /api/companies - List companies
registry.registerPath({
  method: 'get',
  path: '/api/companies',
  summary: 'List all companies',
  tags: ['Companies'],
  responses: {
    200: {
      description: 'List of companies',
      content: {
        'application/json': { schema: CompanyListResponseSchema },
      },
    },
  },
});

// GET /api/companies/:id - Get company
registry.registerPath({
  method: 'get',
  path: '/api/companies/{id}',
  summary: 'Get company by ID',
  tags: ['Companies'],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: 'Company ID' }),
    }),
  },
  responses: {
    200: {
      description: 'Company details',
      content: {
        'application/json': { schema: CompanyResponseSchema },
      },
    },
    404: {
      description: 'Company not found',
      content: {
        'application/json': { schema: ErrorResponseSchema },
      },
    },
  },
});

// PUT /api/companies/:id - Update company
registry.registerPath({
  method: 'put',
  path: '/api/companies/{id}',
  summary: 'Update a company',
  tags: ['Companies'],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: 'Company ID' }),
    }),
    body: {
      content: {
        'application/json': { schema: UpdateCompanySchema },
      },
    },
  },
  responses: {
    200: {
      description: 'Company updated',
      content: {
        'application/json': { schema: CompanyResponseSchema },
      },
    },
    404: {
      description: 'Company not found',
      content: {
        'application/json': { schema: ErrorResponseSchema },
      },
    },
  },
});

// DELETE /api/companies/:id - Delete company
registry.registerPath({
  method: 'delete',
  path: '/api/companies/{id}',
  summary: 'Delete a company',
  tags: ['Companies'],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: 'Company ID' }),
    }),
  },
  responses: {
    204: {
      description: 'Company deleted',
    },
    404: {
      description: 'Company not found',
      content: {
        'application/json': { schema: ErrorResponseSchema },
      },
    },
    409: {
      description: 'Cannot delete company with linked personnel',
      content: {
        'application/json': { schema: ConflictErrorSchema },
      },
    },
  },
});

// POST /api/companies/:id/logo - Update company logo
registry.registerPath({
  method: 'post',
  path: '/api/companies/{id}/logo',
  summary: 'Update company logo',
  tags: ['Companies'],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: 'Company ID' }),
    }),
    body: {
      content: {
        'application/json': { schema: UpdateLogoRequestSchema },
      },
    },
  },
  responses: {
    200: {
      description: 'Logo updated',
      content: {
        'application/json': { schema: CompanyResponseSchema },
      },
    },
    400: {
      description: 'Validation error',
      content: {
        'application/json': { schema: BadRequestErrorSchema },
      },
    },
    404: {
      description: 'Company not found',
      content: {
        'application/json': { schema: ErrorResponseSchema },
      },
    },
  },
});
