/**
 * Common OpenAPI Schemas
 * Issue #431
 */

import { z } from '../setup.js';
import { registry } from '../registry.js';

// ============================================
// Error Response Schemas
// ============================================

export const ErrorResponseSchema = z.object({
  error: z.string().openapi({
    description: 'Error message',
    example: 'Resource not found',
  }),
}).openapi('ErrorResponse');

// Note: ValidationErrorSchema is defined in inspection.ts
// Re-export it from there for consistency

// ============================================
// Pagination Schemas
// ============================================

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).openapi({
    description: 'Page number',
    example: 1,
  }),
  limit: z.coerce.number().int().min(1).max(100).default(20).openapi({
    description: 'Items per page',
    example: 20,
  }),
}).openapi('PaginationQuery');

export const PaginationMetaSchema = z.object({
  page: z.number().openapi({ example: 1 }),
  limit: z.number().openapi({ example: 20 }),
  total: z.number().openapi({ example: 100 }),
  totalPages: z.number().openapi({ example: 5 }),
}).openapi('PaginationMeta');

// ============================================
// Common ID Parameter
// ============================================

export const IdParamSchema = z.object({
  id: z.string().uuid().openapi({
    description: 'Resource ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  }),
}).openapi('IdParam');

// Register common schemas
registry.register('ErrorResponse', ErrorResponseSchema);
registry.register('PaginationQuery', PaginationQuerySchema);
registry.register('PaginationMeta', PaginationMetaSchema);
