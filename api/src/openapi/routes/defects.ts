/**
 * OpenAPI Route Registration for Defects & Moisture Readings
 * Issue #504
 */

import { z } from '../setup.js';
import { registry } from '../registry.js';
import { ErrorResponseSchema } from '../schemas/common.js';

// ============================================
// Defect Schemas
// ============================================

const CreateDefectSchema = z.object({
  defectNumber: z.number().optional(),
  location: z.string().min(1).openapi({ example: 'Bathroom - Level 1' }),
  element: z.string().min(1).openapi({ example: 'Shower waterproofing' }),
  description: z.string().min(1).openapi({ example: 'Missing waterproof membrane at shower base' }),
  cause: z.string().optional(),
  remedialAction: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  photoIds: z.array(z.string().uuid()).optional(),
}).openapi('CreateDefectRequest');

const UpdateDefectSchema = z.object({
  location: z.string().optional(),
  element: z.string().optional(),
  description: z.string().optional(),
  cause: z.string().optional(),
  remedialAction: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  photoIds: z.array(z.string().uuid()).optional(),
}).openapi('UpdateDefectRequest');

const DefectResponseSchema = z.object({
  id: z.string().uuid(),
  siteInspectionId: z.string().uuid(),
  defectNumber: z.number(),
  location: z.string(),
  element: z.string(),
  description: z.string(),
  cause: z.string().nullable(),
  remedialAction: z.string().nullable(),
  priority: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).openapi('DefectResponse');

const DefectListResponseSchema = z.array(DefectResponseSchema).openapi('DefectListResponse');

const inspectionIdParam = z.object({ inspectionId: z.string().uuid().openapi({ description: 'Site Inspection ID' }) });
const defectIdParam = z.object({ id: z.string().uuid().openapi({ description: 'Defect ID' }) });

registry.registerPath({
  method: 'post', path: '/api/site-inspections/{inspectionId}/defects', summary: 'Create defect', tags: ['Defects'],
  request: { params: inspectionIdParam, body: { content: { 'application/json': { schema: CreateDefectSchema } } } },
  responses: {
    201: { description: 'Defect created', content: { 'application/json': { schema: DefectResponseSchema } } },
    400: { description: 'Validation error', content: { 'application/json': { schema: ErrorResponseSchema } } },
    404: { description: 'Inspection not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'get', path: '/api/site-inspections/{inspectionId}/defects', summary: 'List defects for inspection', tags: ['Defects'],
  request: { params: inspectionIdParam },
  responses: { 200: { description: 'Defects', content: { 'application/json': { schema: DefectListResponseSchema } } } },
});

registry.registerPath({
  method: 'get', path: '/api/defects/{id}', summary: 'Get defect by ID', tags: ['Defects'],
  request: { params: defectIdParam },
  responses: {
    200: { description: 'Defect details', content: { 'application/json': { schema: DefectResponseSchema } } },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'put', path: '/api/defects/{id}', summary: 'Update defect', tags: ['Defects'],
  request: { params: defectIdParam, body: { content: { 'application/json': { schema: UpdateDefectSchema } } } },
  responses: {
    200: { description: 'Defect updated', content: { 'application/json': { schema: DefectResponseSchema } } },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'delete', path: '/api/defects/{id}', summary: 'Delete defect', tags: ['Defects'],
  request: { params: defectIdParam },
  responses: {
    204: { description: 'Defect deleted' },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

// ============================================
// Moisture Reading Schemas
// ============================================

const MoistureResultEnum = z.enum(['ACCEPTABLE', 'MARGINAL', 'UNACCEPTABLE']);

const CreateMoistureReadingSchema = z.object({
  location: z.string().min(1).openapi({ example: 'Bathroom wall - north' }),
  substrate: z.string().min(1).openapi({ example: 'Timber framing' }),
  reading: z.number().openapi({ example: 18.5 }),
  depth: z.number().optional().openapi({ example: 25 }),
  result: MoistureResultEnum.openapi({ example: 'ACCEPTABLE' }),
  notes: z.string().optional(),
}).openapi('CreateMoistureReadingRequest');

const UpdateMoistureReadingSchema = z.object({
  location: z.string().optional(),
  substrate: z.string().optional(),
  reading: z.number().optional(),
  depth: z.number().optional(),
  result: MoistureResultEnum.optional(),
  notes: z.string().optional(),
}).openapi('UpdateMoistureReadingRequest');

const MoistureReadingResponseSchema = z.object({
  id: z.string().uuid(),
  siteInspectionId: z.string().uuid(),
  location: z.string(),
  substrate: z.string(),
  reading: z.number(),
  depth: z.number().nullable(),
  result: MoistureResultEnum,
  notes: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).openapi('MoistureReadingResponse');

const MoistureReadingListSchema = z.array(MoistureReadingResponseSchema).openapi('MoistureReadingListResponse');

const moistureInspectionIdParam = z.object({ inspectionId: z.string().uuid().openapi({ description: 'Site Inspection ID' }) });
const moistureIdParam = z.object({ id: z.string().uuid().openapi({ description: 'Moisture Reading ID' }) });

registry.registerPath({
  method: 'post', path: '/api/inspections/{inspectionId}/moisture-readings', summary: 'Create moisture reading', tags: ['Moisture Readings'],
  request: { params: moistureInspectionIdParam, body: { content: { 'application/json': { schema: CreateMoistureReadingSchema } } } },
  responses: {
    201: { description: 'Reading created', content: { 'application/json': { schema: MoistureReadingResponseSchema } } },
    400: { description: 'Validation error', content: { 'application/json': { schema: ErrorResponseSchema } } },
    404: { description: 'Inspection not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'get', path: '/api/inspections/{inspectionId}/moisture-readings', summary: 'List moisture readings', tags: ['Moisture Readings'],
  request: { params: moistureInspectionIdParam },
  responses: { 200: { description: 'Readings', content: { 'application/json': { schema: MoistureReadingListSchema } } } },
});

registry.registerPath({
  method: 'get', path: '/api/moisture-readings/{id}', summary: 'Get moisture reading', tags: ['Moisture Readings'],
  request: { params: moistureIdParam },
  responses: {
    200: { description: 'Reading details', content: { 'application/json': { schema: MoistureReadingResponseSchema } } },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'put', path: '/api/moisture-readings/{id}', summary: 'Update moisture reading', tags: ['Moisture Readings'],
  request: { params: moistureIdParam, body: { content: { 'application/json': { schema: UpdateMoistureReadingSchema } } } },
  responses: {
    200: { description: 'Reading updated', content: { 'application/json': { schema: MoistureReadingResponseSchema } } },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'delete', path: '/api/moisture-readings/{id}', summary: 'Delete moisture reading', tags: ['Moisture Readings'],
  request: { params: moistureIdParam },
  responses: {
    204: { description: 'Reading deleted' },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});
