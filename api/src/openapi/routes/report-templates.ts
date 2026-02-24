/**
 * OpenAPI Route Registration for Report Templates
 * Issue #497
 */

import { z } from '../setup.js';
import { registry } from '../registry.js';
import { ErrorResponseSchema } from '../schemas/common.js';
import { BadRequestErrorSchema } from '../schemas/errors.js';

// ============================================
// Schemas
// ============================================

const TemplateTypeEnum = z.enum(['SECTION', 'BOILERPLATE', 'METHODOLOGY']);
const ReportTypeEnum = z.enum(['COA', 'CCC_GAP', 'PPI', 'SAFE_SANITARY', 'TFA']);

const CreateTemplateSchema = z.object({
  name: z.string().min(1).max(200).openapi({
    description: 'Template name',
    example: 'Introduction Section',
  }),
  type: TemplateTypeEnum.openapi({
    description: 'Template type',
    example: 'SECTION',
  }),
  reportType: ReportTypeEnum.optional().openapi({
    description: 'Report type this template is for',
    example: 'COA',
  }),
  content: z.string().min(1).openapi({
    description: 'Template content with optional variables',
    example: 'This report was prepared for {{client.name}} regarding the property at {{project.address}}.',
  }),
  variables: z.array(z.string()).optional().openapi({
    description: 'List of variable names used in this template',
    example: ['client.name', 'project.address'],
  }),
  isDefault: z.boolean().optional().openapi({
    description: 'Whether this is the default template for its type',
    example: false,
  }),
}).openapi('CreateTemplateRequest');

const UpdateTemplateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  variables: z.array(z.string()).optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
}).openapi('UpdateTemplateRequest');

const CreateVersionSchema = z.object({
  content: z.string().min(1).openapi({
    description: 'New version content',
  }),
  variables: z.array(z.string()).optional(),
  isDefault: z.boolean().optional(),
}).openapi('CreateVersionRequest');

const TemplateResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  type: TemplateTypeEnum,
  reportType: ReportTypeEnum.nullable(),
  content: z.string(),
  variables: z.array(z.string()),
  version: z.number().int(),
  isDefault: z.boolean(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).openapi('TemplateResponse');

const TemplateListSchema = z.array(TemplateResponseSchema).openapi('TemplateList');

const TemplateVersionSchema = z.object({
  id: z.string().uuid(),
  templateId: z.string().uuid(),
  version: z.number().int(),
  content: z.string(),
  variables: z.array(z.string()),
  createdAt: z.string().datetime(),
}).openapi('TemplateVersion');

const TemplateVersionListSchema = z.array(TemplateVersionSchema).openapi('TemplateVersionList');

const VariableContextSchema = z.object({
  project: z.object({
    address: z.string(),
    activity: z.string(),
    jobNumber: z.string(),
    reportType: z.string(),
  }),
  property: z.object({
    lotDp: z.string(),
    councilPropertyId: z.string(),
    territorialAuthority: z.string(),
  }),
  client: z.object({
    name: z.string(),
    address: z.string(),
    phone: z.string(),
    email: z.string(),
    contactPerson: z.string(),
  }),
  company: z.object({
    name: z.string(),
    address: z.string(),
    phone: z.string(),
    email: z.string(),
  }),
  personnel: z.object({
    inspectorName: z.string(),
    authorName: z.string(),
    authorCredentials: z.string(),
    reviewerName: z.string(),
    reviewerCredentials: z.string(),
  }),
  inspection: z.object({
    date: z.string(),
    weather: z.string(),
  }),
}).openapi('VariableContext');

const RenderContextRequestSchema = z.object({
  context: VariableContextSchema,
}).openapi('RenderContextRequest');

const RenderResultSchema = z.object({
  rendered: z.string(),
  missingVariables: z.array(z.string()),
}).openapi('RenderResult');

const AvailableVariablesSchema = z.object({
  variables: z.array(z.string()),
}).openapi('AvailableVariables');

// ============================================
// Routes
// ============================================

// POST /api/templates - Create template
registry.registerPath({
  method: 'post',
  path: '/api/templates',
  summary: 'Create a new template',
  tags: ['Report Templates'],
  request: {
    body: {
      content: {
        'application/json': { schema: CreateTemplateSchema },
      },
    },
  },
  responses: {
    201: {
      description: 'Template created',
      content: {
        'application/json': { schema: TemplateResponseSchema },
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

// GET /api/templates - List templates
registry.registerPath({
  method: 'get',
  path: '/api/templates',
  summary: 'List templates',
  description: 'List templates with optional filters',
  tags: ['Report Templates'],
  request: {
    query: z.object({
      type: TemplateTypeEnum.optional().openapi({ description: 'Filter by template type' }),
      reportType: ReportTypeEnum.optional().openapi({ description: 'Filter by report type' }),
      isDefault: z.string().optional().openapi({ description: 'Filter by default status (true/false)' }),
      isActive: z.string().optional().openapi({ description: 'Filter by active status (true/false)' }),
      name: z.string().optional().openapi({ description: 'Filter by name (partial match)' }),
    }),
  },
  responses: {
    200: {
      description: 'List of templates',
      content: {
        'application/json': { schema: TemplateListSchema },
      },
    },
  },
});

// GET /api/templates/variables - List available variables
registry.registerPath({
  method: 'get',
  path: '/api/templates/variables',
  summary: 'List available template variables',
  tags: ['Report Templates'],
  responses: {
    200: {
      description: 'Available variables',
      content: {
        'application/json': { schema: AvailableVariablesSchema },
      },
    },
  },
});

// GET /api/templates/:id - Get template by ID
registry.registerPath({
  method: 'get',
  path: '/api/templates/{id}',
  summary: 'Get template by ID',
  tags: ['Report Templates'],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: 'Template ID' }),
    }),
  },
  responses: {
    200: {
      description: 'Template details',
      content: {
        'application/json': { schema: TemplateResponseSchema },
      },
    },
    404: {
      description: 'Template not found',
      content: {
        'application/json': { schema: ErrorResponseSchema },
      },
    },
  },
});

// PUT /api/templates/:id - Update template
registry.registerPath({
  method: 'put',
  path: '/api/templates/{id}',
  summary: 'Update a template',
  tags: ['Report Templates'],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: 'Template ID' }),
    }),
    body: {
      content: {
        'application/json': { schema: UpdateTemplateSchema },
      },
    },
  },
  responses: {
    200: {
      description: 'Template updated',
      content: {
        'application/json': { schema: TemplateResponseSchema },
      },
    },
    400: {
      description: 'Validation error',
      content: {
        'application/json': { schema: BadRequestErrorSchema },
      },
    },
    404: {
      description: 'Template not found',
      content: {
        'application/json': { schema: ErrorResponseSchema },
      },
    },
  },
});

// DELETE /api/templates/:id - Delete template
registry.registerPath({
  method: 'delete',
  path: '/api/templates/{id}',
  summary: 'Delete a template',
  tags: ['Report Templates'],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: 'Template ID' }),
    }),
  },
  responses: {
    204: {
      description: 'Template deleted',
    },
    404: {
      description: 'Template not found',
      content: {
        'application/json': { schema: ErrorResponseSchema },
      },
    },
  },
});

// POST /api/templates/:id/versions - Create new version
registry.registerPath({
  method: 'post',
  path: '/api/templates/{id}/versions',
  summary: 'Create a new template version',
  tags: ['Report Templates'],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: 'Template ID' }),
    }),
    body: {
      content: {
        'application/json': { schema: CreateVersionSchema },
      },
    },
  },
  responses: {
    201: {
      description: 'Version created',
      content: {
        'application/json': { schema: TemplateResponseSchema },
      },
    },
    400: {
      description: 'Validation error',
      content: {
        'application/json': { schema: BadRequestErrorSchema },
      },
    },
    404: {
      description: 'Template not found',
      content: {
        'application/json': { schema: ErrorResponseSchema },
      },
    },
  },
});

// GET /api/templates/:id/versions - List all versions
registry.registerPath({
  method: 'get',
  path: '/api/templates/{id}/versions',
  summary: 'List template versions',
  tags: ['Report Templates'],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: 'Template ID' }),
    }),
  },
  responses: {
    200: {
      description: 'List of versions',
      content: {
        'application/json': { schema: TemplateVersionListSchema },
      },
    },
    404: {
      description: 'Template not found',
      content: {
        'application/json': { schema: ErrorResponseSchema },
      },
    },
  },
});

// POST /api/templates/:id/set-default - Mark as default
registry.registerPath({
  method: 'post',
  path: '/api/templates/{id}/set-default',
  summary: 'Set template as default',
  tags: ['Report Templates'],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: 'Template ID' }),
    }),
  },
  responses: {
    200: {
      description: 'Template set as default',
      content: {
        'application/json': { schema: TemplateResponseSchema },
      },
    },
    404: {
      description: 'Template not found',
      content: {
        'application/json': { schema: ErrorResponseSchema },
      },
    },
  },
});

// POST /api/templates/:id/render - Render with context
registry.registerPath({
  method: 'post',
  path: '/api/templates/{id}/render',
  summary: 'Render template with context',
  description: 'Render template by substituting variables with provided context',
  tags: ['Report Templates'],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: 'Template ID' }),
    }),
    body: {
      content: {
        'application/json': { schema: RenderContextRequestSchema },
      },
    },
  },
  responses: {
    200: {
      description: 'Rendered template',
      content: {
        'application/json': { schema: RenderResultSchema },
      },
    },
    400: {
      description: 'Validation error',
      content: {
        'application/json': { schema: BadRequestErrorSchema },
      },
    },
    404: {
      description: 'Template not found',
      content: {
        'application/json': { schema: ErrorResponseSchema },
      },
    },
  },
});

// POST /api/templates/:id/preview - Preview with sample data
registry.registerPath({
  method: 'post',
  path: '/api/templates/{id}/preview',
  summary: 'Preview template with sample data',
  description: 'Preview template by substituting variables with sample data',
  tags: ['Report Templates'],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: 'Template ID' }),
    }),
  },
  responses: {
    200: {
      description: 'Preview result',
      content: {
        'application/json': { schema: RenderResultSchema },
      },
    },
    404: {
      description: 'Template not found',
      content: {
        'application/json': { schema: ErrorResponseSchema },
      },
    },
  },
});
