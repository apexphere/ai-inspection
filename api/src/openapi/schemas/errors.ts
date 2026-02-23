/**
 * Standardized Error Response Schemas
 * Issue #432
 */

import { z } from '../setup.js';
import { registry } from '../registry.js';

// ============================================
// Common Error Schemas
// ============================================

/**
 * 400 Bad Request - Validation errors
 */
export const BadRequestErrorSchema = z.object({
  error: z.string().openapi({
    description: 'Error type',
    example: 'Validation failed',
  }),
  details: z.record(z.array(z.string())).optional().openapi({
    description: 'Field-specific validation errors',
    example: {
      address: ['Address is required'],
      clientName: ['Client name must be at least 1 character'],
    },
  }),
}).openapi('BadRequestError');

/**
 * 401 Unauthorized - Authentication required
 */
export const UnauthorizedErrorSchema = z.object({
  error: z.string().openapi({
    description: 'Error message',
    example: 'Authentication required',
  }),
}).openapi('UnauthorizedError');

/**
 * 403 Forbidden - Insufficient permissions
 */
export const ForbiddenErrorSchema = z.object({
  error: z.string().openapi({
    description: 'Error message',
    example: 'Admin access required',
  }),
}).openapi('ForbiddenError');

/**
 * 404 Not Found - Resource doesn't exist
 */
export const NotFoundErrorSchema = z.object({
  error: z.string().openapi({
    description: 'Error message',
    example: 'Resource not found',
  }),
}).openapi('NotFoundError');

/**
 * 409 Conflict - Resource already exists
 */
export const ConflictErrorSchema = z.object({
  error: z.string().openapi({
    description: 'Error message',
    example: 'Resource already exists',
  }),
}).openapi('ConflictError');

/**
 * 500 Internal Server Error - Unexpected errors
 */
export const InternalErrorSchema = z.object({
  error: z.string().openapi({
    description: 'Error message',
    example: 'Internal server error',
  }),
}).openapi('InternalError');

// ============================================
// Register Schemas
// ============================================

registry.register('BadRequestError', BadRequestErrorSchema);
registry.register('UnauthorizedError', UnauthorizedErrorSchema);
registry.register('ForbiddenError', ForbiddenErrorSchema);
registry.register('NotFoundError', NotFoundErrorSchema);
registry.register('ConflictError', ConflictErrorSchema);
registry.register('InternalError', InternalErrorSchema);
