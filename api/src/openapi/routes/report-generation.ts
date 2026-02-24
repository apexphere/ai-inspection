/**
 * OpenAPI Route Registration for Report Generation & Export
 * Issue #501
 */

import { z } from '../setup.js';
import { registry } from '../registry.js';
import { ErrorResponseSchema } from '../schemas/common.js';

// ============================================
// Report Generation Schemas
// ============================================

const GenerateRequestSchema = z.object({
  format: z.enum(['pdf', 'docx']).optional().openapi({ example: 'pdf' }),
}).openapi('GenerateReportRequest');

const GenerationStatusSchema = z.object({
  reportId: z.string().uuid(),
  status: z.enum(['PENDING', 'GENERATING', 'COMPLETED', 'FAILED']),
  format: z.string(),
  startedAt: z.string().datetime().nullable(),
  completedAt: z.string().datetime().nullable(),
  error: z.string().nullable(),
}).openapi('GenerationStatusResponse');

const GeneratedReportSchema = z.object({
  id: z.string().uuid(),
  reportId: z.string().uuid(),
  format: z.string(),
  filename: z.string(),
  r2Key: z.string().nullable(),
  localPath: z.string().nullable(),
  fileSize: z.number().nullable(),
  pageCount: z.number().nullable(),
  photoCount: z.number().nullable(),
  version: z.number(),
  createdAt: z.string().datetime(),
}).openapi('GeneratedReportResponse');

const GeneratedReportListSchema = z.array(GeneratedReportSchema).openapi('GeneratedReportListResponse');

const reportIdParam = z.object({ id: z.string().uuid().openapi({ description: 'Report ID' }) });

// ============================================
// Report Generation Routes
// ============================================

registry.registerPath({
  method: 'post', path: '/api/reports/{id}/generate', summary: 'Generate PDF report', tags: ['Report Generation'],
  description: 'Triggers PDF generation for the report.',
  request: { params: reportIdParam },
  responses: {
    200: { description: 'Generation started', content: { 'application/json': { schema: GenerationStatusSchema } } },
    404: { description: 'Report not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'get', path: '/api/reports/{id}/generate/status', summary: 'Get generation status', tags: ['Report Generation'],
  request: { params: reportIdParam },
  responses: {
    200: { description: 'Generation status', content: { 'application/json': { schema: GenerationStatusSchema } } },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'delete', path: '/api/reports/jobs/{jobId}/generate', summary: 'Cancel generation job', tags: ['Report Generation'],
  request: { params: z.object({ jobId: z.string().uuid().openapi({ description: 'Job ID' }) }) },
  responses: {
    200: { description: 'Job cancelled' },
    404: { description: 'Job not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'post', path: '/api/reports/{id}/generate/docx', summary: 'Generate DOCX report', tags: ['Report Generation'],
  request: { params: reportIdParam },
  responses: {
    200: { description: 'DOCX generation started', content: { 'application/json': { schema: GenerationStatusSchema } } },
    404: { description: 'Report not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

// ============================================
// Generated Reports (Download/List)
// ============================================

registry.registerPath({
  method: 'get', path: '/api/reports/{id}/generated', summary: 'List generated files for report', tags: ['Report Generation'],
  request: { params: reportIdParam },
  responses: {
    200: { description: 'Generated files', content: { 'application/json': { schema: GeneratedReportListSchema } } },
    404: { description: 'Report not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'get', path: '/api/reports/{id}/download/{format}', summary: 'Download latest report by format', tags: ['Report Generation'],
  description: 'Downloads the latest generated file. Redirects to presigned R2 URL or streams local file.',
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: 'Report ID' }),
      format: z.enum(['pdf', 'docx']).openapi({ description: 'File format' }),
    }),
  },
  responses: {
    302: { description: 'Redirect to download URL' },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'get', path: '/api/generated-reports/file/{id}/download', summary: 'Download specific generated file', tags: ['Report Generation'],
  request: { params: z.object({ id: z.string().uuid().openapi({ description: 'Generated Report ID' }) }) },
  responses: {
    302: { description: 'Redirect to download URL' },
    404: { description: 'File not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});
