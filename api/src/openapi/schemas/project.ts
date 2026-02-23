/**
 * OpenAPI Schemas for Project Endpoints
 * Issue #431
 */

import { z } from '../setup.js';
import { registry } from '../registry.js';

// ============================================
// Enums
// ============================================

export const ReportTypeSchema = z.enum(['COA', 'CCC_GAP', 'PPI', 'SAFE_SANITARY', 'TFA']).openapi({
  description: 'Type of inspection report',
  example: 'PPI',
});

export const ProjectStatusSchema = z.enum(['DRAFT', 'IN_PROGRESS', 'REVIEW', 'COMPLETED']).openapi({
  description: 'Current status of the project',
  example: 'IN_PROGRESS',
});

// ============================================
// Request Schemas
// ============================================

export const CreateProjectSchema = z.object({
  jobNumber: z.string().min(1).optional().openapi({
    description: 'Unique job number (auto-generated if not provided)',
    example: 'JOB-2026-001',
  }),
  activity: z.string().min(1).openapi({
    description: 'Activity description',
    example: 'Pre-purchase inspection',
  }),
  reportType: ReportTypeSchema,
  propertyId: z.string().uuid().openapi({
    description: 'Property ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  }),
  clientId: z.string().uuid().openapi({
    description: 'Client ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  }),
}).openapi('CreateProjectRequest');

export const UpdateProjectSchema = z.object({
  jobNumber: z.string().min(1).optional(),
  activity: z.string().min(1).optional(),
  reportType: ReportTypeSchema.optional(),
  status: ProjectStatusSchema.optional(),
  propertyId: z.string().uuid().optional(),
  clientId: z.string().uuid().optional(),
}).openapi('UpdateProjectRequest');

// ============================================
// Response Schemas
// ============================================

export const ProjectResponseSchema = z.object({
  id: z.string().uuid().openapi({
    description: 'Project ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  }),
  jobNumber: z.string().openapi({
    description: 'Job number',
    example: 'JOB-2026-001',
  }),
  activity: z.string().openapi({
    description: 'Activity description',
    example: 'Pre-purchase inspection',
  }),
  reportType: ReportTypeSchema,
  status: ProjectStatusSchema,
  propertyId: z.string().uuid(),
  clientId: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  property: z.object({
    id: z.string().uuid(),
    streetAddress: z.string(),
    suburb: z.string().nullable(),
    city: z.string().nullable(),
  }).optional().openapi({
    description: 'Associated property (when expanded)',
  }),
  client: z.object({
    id: z.string().uuid(),
    name: z.string(),
    email: z.string().nullable(),
  }).optional().openapi({
    description: 'Associated client (when expanded)',
  }),
}).openapi('ProjectResponse');

export const ProjectListResponseSchema = z.array(ProjectResponseSchema).openapi('ProjectListResponse');

// ============================================
// Register Schemas
// ============================================

registry.register('ReportType', ReportTypeSchema);
registry.register('ProjectStatus', ProjectStatusSchema);
registry.register('CreateProjectRequest', CreateProjectSchema);
registry.register('UpdateProjectRequest', UpdateProjectSchema);
registry.register('ProjectResponse', ProjectResponseSchema);
registry.register('ProjectListResponse', ProjectListResponseSchema);

// ============================================
// Register Routes
// ============================================

registry.registerPath({
  method: 'post',
  path: '/api/projects',
  tags: ['Projects'],
  summary: 'Create a new project',
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateProjectSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Project created successfully',
      content: {
        'application/json': {
          schema: ProjectResponseSchema,
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
  path: '/api/projects',
  tags: ['Projects'],
  summary: 'List all projects',
  request: {
    query: z.object({
      jobNumber: z.string().optional().openapi({ description: 'Filter by job number' }),
      address: z.string().optional().openapi({ description: 'Filter by property address' }),
      clientName: z.string().optional().openapi({ description: 'Filter by client name' }),
      status: ProjectStatusSchema.optional(),
      reportType: ReportTypeSchema.optional(),
    }),
  },
  responses: {
    200: {
      description: 'List of projects',
      content: {
        'application/json': {
          schema: ProjectListResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/projects/{id}',
  tags: ['Projects'],
  summary: 'Get project by ID',
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: 'Project ID' }),
    }),
  },
  responses: {
    200: {
      description: 'Project details',
      content: {
        'application/json': {
          schema: ProjectResponseSchema,
        },
      },
    },
    404: {
      description: 'Project not found',
    },
  },
});

registry.registerPath({
  method: 'put',
  path: '/api/projects/{id}',
  tags: ['Projects'],
  summary: 'Update a project',
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: 'Project ID' }),
    }),
    body: {
      content: {
        'application/json': {
          schema: UpdateProjectSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Project updated',
      content: {
        'application/json': {
          schema: ProjectResponseSchema,
        },
      },
    },
    404: {
      description: 'Project not found',
    },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/projects/{id}',
  tags: ['Projects'],
  summary: 'Delete a project',
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: 'Project ID' }),
    }),
  },
  responses: {
    204: {
      description: 'Project deleted',
    },
    404: {
      description: 'Project not found',
    },
  },
});
