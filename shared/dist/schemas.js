/**
 * Zod Schemas — Issue #42
 *
 * Validation schemas that match the TypeScript types.
 */
import { z } from 'zod';
import { Status, Severity } from './types.js';
// ============================================================================
// Enum Schemas
// ============================================================================
export const StatusSchema = z.nativeEnum(Status);
export const SeveritySchema = z.nativeEnum(Severity);
// ============================================================================
// Core Schemas
// ============================================================================
export const PhotoSchema = z.object({
    id: z.string().uuid(),
    findingId: z.string().uuid(),
    filename: z.string().min(1),
    path: z.string().min(1),
    mimeType: z.string().min(1),
});
export const FindingSchema = z.object({
    id: z.string().uuid(),
    inspectionId: z.string().uuid(),
    section: z.string().min(1),
    text: z.string().min(1),
    severity: SeveritySchema,
    matchedComment: z.string().optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
    photos: z.array(PhotoSchema).optional(),
});
export const InspectionSchema = z.object({
    id: z.string().uuid(),
    address: z.string().min(1),
    clientName: z.string().min(1),
    inspectorName: z.string().optional(),
    checklistId: z.string().min(1),
    status: StatusSchema,
    currentSection: z.string().min(1),
    metadata: z.record(z.unknown()).optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
    completedAt: z.date().optional(),
    findings: z.array(FindingSchema).optional(),
});
// ============================================================================
// API Response Schemas (with string dates)
// ============================================================================
export const PhotoResponseSchema = z.object({
    id: z.string().uuid(),
    findingId: z.string().uuid(),
    filename: z.string(),
    path: z.string(),
    mimeType: z.string(),
});
export const FindingResponseSchema = z.object({
    id: z.string().uuid(),
    inspectionId: z.string().uuid(),
    section: z.string(),
    text: z.string(),
    severity: SeveritySchema,
    matchedComment: z.string().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    photos: z.array(PhotoResponseSchema),
});
export const InspectionResponseSchema = z.object({
    id: z.string().uuid(),
    address: z.string(),
    clientName: z.string(),
    inspectorName: z.string().nullable(),
    checklistId: z.string(),
    status: StatusSchema,
    currentSection: z.string(),
    metadata: z.record(z.unknown()).nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    completedAt: z.string().datetime().nullable(),
});
export const InspectionDetailResponseSchema = InspectionResponseSchema.extend({
    findings: z.array(FindingResponseSchema),
});
// ============================================================================
// Input Schemas
// ============================================================================
export const CreateInspectionInputSchema = z.object({
    address: z.string().min(1, 'Address is required'),
    clientName: z.string().min(1, 'Client name is required'),
    inspectorName: z.string().optional(),
    checklistId: z.string().min(1, 'Checklist ID is required'),
});
export const UpdateInspectionInputSchema = z.object({
    address: z.string().min(1).optional(),
    clientName: z.string().min(1).optional(),
    inspectorName: z.string().optional(),
    status: StatusSchema.optional(),
    currentSection: z.string().min(1).optional(),
});
export const CreateFindingInputSchema = z.object({
    section: z.string().min(1, 'Section is required'),
    text: z.string().min(1, 'Finding text is required'),
    severity: SeveritySchema.optional().default(Severity.INFO),
    matchedComment: z.string().optional(),
});
export const UpdateFindingInputSchema = z.object({
    section: z.string().min(1).optional(),
    text: z.string().min(1).optional(),
    severity: SeveritySchema.optional(),
    matchedComment: z.string().optional(),
});
export const UploadPhotoInputSchema = z.object({
    base64Data: z.string().min(1, 'Base64 data is required'),
    mimeType: z.string().optional(),
});
//# sourceMappingURL=schemas.js.map