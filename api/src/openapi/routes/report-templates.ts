/**
 * OpenAPI Route Registration for Report Templates
 * Issue #502
 */

import { z } from '../setup.js';
import { registry } from '../registry.js';
import { ErrorResponseSchema } from '../schemas/common.js';

// ============================================
// Schemas
// ============================================

const TemplateTypeEnum = z.enum(['SECTION', 'BOILERPLATE', 'METHODOLOGY']);
const ReportTypeEnum = z.enum(['COA', 'CCC_GAP', 'PPI', 'SAFE_SANITARY', 'TFA']);

const CreateTemplateSchema = z.object({
  name: z.string().min(1).max(200).openapi({ example: 'Introduction - COA' }),
  type: TemplateTypeEnum,
  reportType: ReportTypeEnum.optional(),
  content: z.string().min(1).openapi({ example: '[Company Name] have been engaged...' }),
  variables: z.array(z.string()).optional().openapi({ example: ['Company Name', 'Address'] }),
  isDefault: z.boolean().optional(),
}).openapi('CreateTemplateRequest');

const UpdateTemplateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  variables: z.array(z.string()).optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
}).openapi('UpdateTemplateRequest');

const TemplateResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  type: TemplateTypeEnum,
  reportType: ReportTypeEnum.nullable(),
  content: z.string(),
  variables: z.array(z.string()),
  version: z.number(),
  isDefault: z.boolean(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).openapi('TemplateResponse');

const TemplateListResponseSchema = z.array(TemplateResponseSchema).openapi('TemplateListResponse');

const CreateVersionSchema = z.object({
  content: z.string().min(1),
  variables: z.array(z.string()).optional(),
  isDefault: z.boolean().optional(),
}).openapi('CreateTemplateVersionRequest');

const VariableInfoSchema = z.object({
  name: z.string(),
  path: z.string(),
  description: z.string(),
}).openapi('VariableInfo');

const RenderRequestSchema = z.object({
  context: z.record(z.unknown()),
}).openapi('RenderTemplateRequest');

const RenderResponseSchema = z.object({
  content: z.string(),
  warnings: z.array(z.string()),
  substitutionCount: z.number(),
  missingVariables: z.array(z.string()),
}).openapi('RenderTemplateResponse');

registry.register('TemplateResponse', TemplateResponseSchema);

// ============================================
// Routes
// ============================================

const templateIdParam = z.object({ id: z.string().uuid().openapi({ description: 'Template ID' }) });

registry.registerPath({
  method: 'post', path: '/api/templates', summary: 'Create template', tags: ['Report Templates'],
  request: { body: { content: { 'application/json': { schema: CreateTemplateSchema } } } },
  responses: {
    201: { description: 'Template created', content: { 'application/json': { schema: TemplateResponseSchema } } },
    400: { description: 'Validation error', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'get', path: '/api/templates', summary: 'List templates', tags: ['Report Templates'],
  request: {
    query: z.object({
      type: TemplateTypeEnum.optional(),
      reportType: ReportTypeEnum.optional(),
      isDefault: z.string().optional().openapi({ description: '"true" or "false"' }),
      isActive: z.string().optional(),
      name: z.string().optional(),
    }),
  },
  responses: { 200: { description: 'Templates', content: { 'application/json': { schema: TemplateListResponseSchema } } } },
});

registry.registerPath({
  method: 'get', path: '/api/templates/variables', summary: 'List available variables', tags: ['Report Templates'],
  description: 'Returns all variable names available for template substitution.',
  responses: {
    200: { description: 'Variable list', content: { 'application/json': { schema: z.object({ variables: z.array(VariableInfoSchema) }).openapi('VariablesListResponse') } } },
  },
});

registry.registerPath({
  method: 'get', path: '/api/templates/{id}', summary: 'Get template by ID', tags: ['Report Templates'],
  request: { params: templateIdParam },
  responses: {
    200: { description: 'Template details', content: { 'application/json': { schema: TemplateResponseSchema } } },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'put', path: '/api/templates/{id}', summary: 'Update template', tags: ['Report Templates'],
  request: { params: templateIdParam, body: { content: { 'application/json': { schema: UpdateTemplateSchema } } } },
  responses: {
    200: { description: 'Template updated', content: { 'application/json': { schema: TemplateResponseSchema } } },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'delete', path: '/api/templates/{id}', summary: 'Delete template', tags: ['Report Templates'],
  request: { params: templateIdParam },
  responses: {
    204: { description: 'Template deleted' },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'post', path: '/api/templates/{id}/versions', summary: 'Create new version', tags: ['Report Templates'],
  request: { params: templateIdParam, body: { content: { 'application/json': { schema: CreateVersionSchema } } } },
  responses: {
    201: { description: 'Version created', content: { 'application/json': { schema: TemplateResponseSchema } } },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'get', path: '/api/templates/{id}/versions', summary: 'List version history', tags: ['Report Templates'],
  request: { params: templateIdParam },
  responses: {
    200: { description: 'Version list', content: { 'application/json': { schema: TemplateListResponseSchema } } },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'post', path: '/api/templates/{id}/set-default', summary: 'Set as default template', tags: ['Report Templates'],
  request: { params: templateIdParam },
  responses: {
    200: { description: 'Set as default', content: { 'application/json': { schema: TemplateResponseSchema } } },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'post', path: '/api/templates/{id}/render', summary: 'Render template with data', tags: ['Report Templates'],
  description: 'Substitutes [Variable Name] placeholders with provided context values.',
  request: { params: templateIdParam, body: { content: { 'application/json': { schema: RenderRequestSchema } } } },
  responses: {
    200: { description: 'Rendered content', content: { 'application/json': { schema: RenderResponseSchema } } },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'post', path: '/api/templates/{id}/preview', summary: 'Preview template with sample data', tags: ['Report Templates'],
  request: { params: templateIdParam },
  responses: {
    200: { description: 'Preview content', content: { 'application/json': { schema: RenderResponseSchema } } },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});
