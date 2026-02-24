/**
 * OpenAPI Route Registration for Auth
 * Issue #453
 */

import { z } from '../setup.js';
import { registry } from '../registry.js';
import { BadRequestErrorSchema, UnauthorizedErrorSchema, ConflictErrorSchema } from '../schemas/errors.js';

// ============================================
// Auth Schemas
// ============================================

const RegisterRequestSchema = z.object({
  email: z.string().email().openapi({ example: 'user@example.com' }),
  password: z.string().min(8).openapi({ example: 'securepass123' }),
}).openapi('RegisterRequest');

const LoginRequestSchema = z.object({
  email: z.string().email().openapi({ example: 'user@example.com' }),
  password: z.string().min(1).openapi({ example: 'securepass123' }),
}).openapi('LoginRequest');

const AuthUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
}).openapi('AuthUser');

const AuthResponseSchema = z.object({
  message: z.string(),
  user: AuthUserSchema,
  token: z.string(),
}).openapi('AuthResponse');

const AuthCheckResponseSchema = z.object({
  authenticated: z.boolean(),
  user: AuthUserSchema.optional(),
}).openapi('AuthCheckResponse');

const MessageResponseSchema = z.object({
  message: z.string(),
}).openapi('MessageResponse');

const ForgotPasswordRequestSchema = z.object({
  email: z.string().email().openapi({ example: 'user@example.com' }),
}).openapi('ForgotPasswordRequest');

const ResetPasswordRequestSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
}).openapi('ResetPasswordRequest');

const LinkWhatsAppRequestSchema = z.object({
  phoneNumber: z.string().openapi({ example: '+6421555100' }),
}).openapi('LinkWhatsAppRequest');

const VerifyWhatsAppRequestSchema = z.object({
  phoneNumber: z.string(),
  code: z.string().length(6),
}).openapi('VerifyWhatsAppRequest');

const WhatsAppStatusResponseSchema = z.object({
  linked: z.boolean(),
  phoneNumber: z.string().nullable(),
  verified: z.boolean(),
}).openapi('WhatsAppStatusResponse');

registry.register('RegisterRequest', RegisterRequestSchema);
registry.register('LoginRequest', LoginRequestSchema);
registry.register('AuthResponse', AuthResponseSchema);

// ============================================
// Routes
// ============================================

registry.registerPath({
  method: 'post',
  path: '/api/auth/register',
  summary: 'Register a new account',
  tags: ['Auth'],
  request: {
    body: { content: { 'application/json': { schema: RegisterRequestSchema } }, required: true },
  },
  responses: {
    201: { description: 'Registration successful', content: { 'application/json': { schema: AuthResponseSchema } } },
    400: { description: 'Validation error', content: { 'application/json': { schema: BadRequestErrorSchema } } },
    409: { description: 'Email already registered', content: { 'application/json': { schema: ConflictErrorSchema } } },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/auth/login',
  summary: 'Login with email and password',
  tags: ['Auth'],
  request: {
    body: { content: { 'application/json': { schema: LoginRequestSchema } }, required: true },
  },
  responses: {
    200: { description: 'Login successful', content: { 'application/json': { schema: AuthResponseSchema } } },
    400: { description: 'Validation error', content: { 'application/json': { schema: BadRequestErrorSchema } } },
    401: { description: 'Invalid credentials', content: { 'application/json': { schema: UnauthorizedErrorSchema } } },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/auth/logout',
  summary: 'Logout (clear auth cookie)',
  tags: ['Auth'],
  responses: {
    200: { description: 'Logged out', content: { 'application/json': { schema: MessageResponseSchema } } },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/auth/check',
  summary: 'Check authentication status',
  tags: ['Auth'],
  responses: {
    200: { description: 'Auth status', content: { 'application/json': { schema: AuthCheckResponseSchema } } },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/auth/me',
  summary: 'Get current user info',
  tags: ['Auth'],
  responses: {
    200: { description: 'User info', content: { 'application/json': { schema: z.object({ user: AuthUserSchema }) } } },
    401: { description: 'Not authenticated', content: { 'application/json': { schema: UnauthorizedErrorSchema } } },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/auth/forgot-password',
  summary: 'Request password reset',
  tags: ['Auth'],
  request: {
    body: { content: { 'application/json': { schema: ForgotPasswordRequestSchema } }, required: true },
  },
  responses: {
    200: { description: 'Reset email sent (if account exists)', content: { 'application/json': { schema: MessageResponseSchema } } },
    400: { description: 'Validation error', content: { 'application/json': { schema: BadRequestErrorSchema } } },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/auth/reset-password',
  summary: 'Reset password with token',
  tags: ['Auth'],
  request: {
    body: { content: { 'application/json': { schema: ResetPasswordRequestSchema } }, required: true },
  },
  responses: {
    200: { description: 'Password reset', content: { 'application/json': { schema: MessageResponseSchema } } },
    400: { description: 'Invalid or expired token', content: { 'application/json': { schema: BadRequestErrorSchema } } },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/auth/link-whatsapp',
  summary: 'Request WhatsApp number linking',
  tags: ['Auth'],
  request: {
    body: { content: { 'application/json': { schema: LinkWhatsAppRequestSchema } }, required: true },
  },
  responses: {
    200: { description: 'Verification code sent', content: { 'application/json': { schema: MessageResponseSchema } } },
    401: { description: 'Not authenticated', content: { 'application/json': { schema: UnauthorizedErrorSchema } } },
    409: { description: 'Phone already linked', content: { 'application/json': { schema: ConflictErrorSchema } } },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/auth/verify-whatsapp',
  summary: 'Verify WhatsApp number with code',
  tags: ['Auth'],
  request: {
    body: { content: { 'application/json': { schema: VerifyWhatsAppRequestSchema } }, required: true },
  },
  responses: {
    200: { description: 'Number verified', content: { 'application/json': { schema: MessageResponseSchema } } },
    400: { description: 'Invalid or expired code', content: { 'application/json': { schema: BadRequestErrorSchema } } },
    401: { description: 'Not authenticated', content: { 'application/json': { schema: UnauthorizedErrorSchema } } },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/auth/unlink-whatsapp',
  summary: 'Unlink WhatsApp number',
  tags: ['Auth'],
  responses: {
    200: { description: 'Number unlinked', content: { 'application/json': { schema: MessageResponseSchema } } },
    401: { description: 'Not authenticated', content: { 'application/json': { schema: UnauthorizedErrorSchema } } },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/auth/whatsapp-status',
  summary: 'Get WhatsApp linking status',
  tags: ['Auth'],
  responses: {
    200: { description: 'WhatsApp status', content: { 'application/json': { schema: WhatsAppStatusResponseSchema } } },
    401: { description: 'Not authenticated', content: { 'application/json': { schema: UnauthorizedErrorSchema } } },
  },
});
