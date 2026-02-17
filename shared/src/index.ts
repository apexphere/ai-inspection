/**
 * @ai-inspection/shared
 *
 * Shared types and validation schemas for API, MCP, and Web UI.
 */

// Types
export {
  // Enums
  Status,
  Severity,
  // Core types
  Photo,
  Finding,
  Inspection,
  // API response types
  PhotoResponse,
  FindingResponse,
  InspectionResponse,
  InspectionDetailResponse,
  // Input types
  CreateInspectionInput,
  UpdateInspectionInput,
  CreateFindingInput,
  UpdateFindingInput,
  UploadPhotoInput,
  // Type aliases
  InspectionStatus,
  FindingSeverity,
} from './types.js';

// Schemas
export {
  // Enum schemas
  StatusSchema,
  SeveritySchema,
  // Core schemas
  PhotoSchema,
  FindingSchema,
  InspectionSchema,
  // API response schemas
  PhotoResponseSchema,
  FindingResponseSchema,
  InspectionResponseSchema,
  InspectionDetailResponseSchema,
  // Input schemas
  CreateInspectionInputSchema,
  UpdateInspectionInputSchema,
  CreateFindingInputSchema,
  UpdateFindingInputSchema,
  UploadPhotoInputSchema,
  // Inferred types
  type PhotoSchemaType,
  type FindingSchemaType,
  type InspectionSchemaType,
  type CreateInspectionInputSchemaType,
  type UpdateInspectionInputSchemaType,
  type CreateFindingInputSchemaType,
  type UpdateFindingInputSchemaType,
  type UploadPhotoInputSchemaType,
} from './schemas.js';
