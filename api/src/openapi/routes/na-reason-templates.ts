/**
 * OpenAPI Route Registration for NA Reason Templates
 * Issue #453
 */

import { z } from '../setup.js';
import { registry } from '../registry.js';
import { UnauthorizedErrorSchema } from '../schemas/errors.js';
import { ErrorResponseSchema } from '../schemas/common.js';

const NAReasonTemplateSchema = z.object({
  id: z.string().uuid(),
  reason: z.string(),
  category: z.string().nullable(),
  sortOrder: z.number(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).openapi('NAReasonTemplate');

const IdParam = z.object({ id: z.string().uuid() });

registry.register('NAReasonTemplate', NAReasonTemplateSchema);

registry.registerPath({
  method: 'get',
  path: '/api/na-reason-templates',
  summary: 'List all NA reason templates',
  description: 'Predefined reasons for marking checklist items or clause reviews as not applicable.',
  tags: ['Reference Data'],
  responses: {
    200: { description: 'Templates', content: { 'application/json': { schema: z.array(NAReasonTemplateSchema) } } },
    401: { description: 'Unauthorized', content: { 'application/json': { schema: UnauthorizedErrorSchema } } },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/na-reason-templates/{id}',
  summary: 'Get NA reason template by ID',
  tags: ['Reference Data'],
  request: { params: IdParam },
  responses: {
    200: { description: 'Template', content: { 'application/json': { schema: NAReasonTemplateSchema } } },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});
