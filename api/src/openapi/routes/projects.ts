/**
 * OpenAPI Route Registration for Projects
 * Issue #431
 */

import { z } from '../setup.js';
import { registry } from '../registry.js';
import { ValidationErrorSchema, NotFoundErrorSchema } from '../schemas/inspection.js';
import { ErrorResponseSchema } from '../schemas/common.js';

// ============================================
// Project Schemas
// ============================================

const ProjectStatusSchema = z.enum(['DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED']).openapi({
  description: 'Project status',
  example: 'ACTIVE',
});

const CreateProjectSchema = z.object({
  name: z.string().min(1).openapi({
    description: 'Project name',
    example: 'Auckland Inspection Project',
  }),
  description: z.string().optional().openapi({
    description: 'Project description',
  }),
  clientId: z.string().uuid().optional().openapi({
    description: 'Associated client ID',
  }),
}).openapi('CreateProjectRequest');

const ProjectSchema = z.object({
  id: z.string().uuid().openapi({ example: '123e4567-e89b-12d3-a456-426614174000' }),
  name: z.string().openapi({ example: 'Auckland Inspection Project' }),
  description: z.string().nullable().openapi({ example: 'Multi-site inspection project' }),
  status: ProjectStatusSchema,
  clientId: z.string().uuid().nullable(),
  createdAt: z.string().datetime().openapi({ example: '2026-02-23T10:00:00.000Z' }),
  updatedAt: z.string().datetime().openapi({ example: '2026-02-23T10:00:00.000Z' }),
}).openapi('Project');

const ProjectListSchema = z.array(ProjectSchema).openapi('ProjectList');

// Path parameter schema
const ProjectIdParam = z.object({
  id: z.string().uuid().openapi({ description: 'Project ID' }),
});

registry.register('CreateProjectRequest', CreateProjectSchema);
registry.register('Project', ProjectSchema);
registry.register('ProjectList', ProjectListSchema);

// ============================================
// Routes
// ============================================

// POST /api/projects - Create project
registry.registerPath({
  method: 'post',
  path: '/api/projects',
  summary: 'Create a new project',
  description: 'Create a new inspection project.',
  tags: ['Projects'],
  request: {
    body: {
      content: {
        'application/json': { schema: CreateProjectSchema },
      },
      required: true,
    },
  },
  responses: {
    201: {
      description: 'Project created successfully',
      content: {
        'application/json': { schema: ProjectSchema },
      },
    },
    400: {
      description: 'Validation error',
      content: {
        'application/json': { schema: ValidationErrorSchema },
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

// GET /api/projects - List projects
registry.registerPath({
  method: 'get',
  path: '/api/projects',
  summary: 'List all projects',
  description: 'Retrieve a list of all projects.',
  tags: ['Projects'],
  responses: {
    200: {
      description: 'List of projects',
      content: {
        'application/json': { schema: ProjectListSchema },
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

// GET /api/projects/:id - Get project by ID
registry.registerPath({
  method: 'get',
  path: '/api/projects/{id}',
  summary: 'Get project by ID',
  description: 'Retrieve a specific project.',
  tags: ['Projects'],
  request: {
    params: ProjectIdParam,
  },
  responses: {
    200: {
      description: 'Project details',
      content: {
        'application/json': { schema: ProjectSchema },
      },
    },
    404: {
      description: 'Project not found',
      content: {
        'application/json': { schema: NotFoundErrorSchema },
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
