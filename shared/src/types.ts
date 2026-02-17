/**
 * Shared Types — Issue #42
 *
 * Core domain types used across API, MCP, and Web UI.
 */

// ============================================================================
// Enums
// ============================================================================

export enum Status {
  STARTED = 'STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export enum Severity {
  INFO = 'INFO',
  MINOR = 'MINOR',
  MAJOR = 'MAJOR',
  URGENT = 'URGENT',
}

// Type aliases for string literal unions (useful for API consumers)
export type InspectionStatus = `${Status}`;
export type FindingSeverity = `${Severity}`;

// ============================================================================
// Core Types
// ============================================================================

export interface Photo {
  id: string;
  findingId: string;
  filename: string;
  path: string;
  mimeType: string;
}

export interface Finding {
  id: string;
  inspectionId: string;
  section: string;
  text: string;
  severity: Severity;
  matchedComment?: string;
  createdAt: Date;
  updatedAt: Date;
  photos?: Photo[];
}

export interface Inspection {
  id: string;
  address: string;
  clientName: string;
  inspectorName?: string;
  checklistId: string;
  status: Status;
  currentSection: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  findings?: Finding[];
}

// ============================================================================
// API Response Types (with string dates for JSON serialization)
// ============================================================================

export interface PhotoResponse {
  id: string;
  findingId: string;
  filename: string;
  path: string;
  mimeType: string;
}

export interface FindingResponse {
  id: string;
  inspectionId: string;
  section: string;
  text: string;
  severity: Severity;
  matchedComment: string | null;
  createdAt: string;
  updatedAt: string;
  photos: PhotoResponse[];
}

export interface InspectionResponse {
  id: string;
  address: string;
  clientName: string;
  inspectorName: string | null;
  checklistId: string;
  status: Status;
  currentSection: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface InspectionDetailResponse extends InspectionResponse {
  findings: FindingResponse[];
}

// ============================================================================
// Input Types (for create/update operations)
// ============================================================================

export interface CreateInspectionInput {
  address: string;
  clientName: string;
  inspectorName?: string;
  checklistId: string;
}

export interface UpdateInspectionInput {
  address?: string;
  clientName?: string;
  inspectorName?: string;
  status?: Status;
  currentSection?: string;
}

export interface CreateFindingInput {
  section: string;
  text: string;
  severity?: FindingSeverity;
  matchedComment?: string;
}

export interface UpdateFindingInput {
  section?: string;
  text?: string;
  severity?: FindingSeverity;
  matchedComment?: string;
}

export interface UploadPhotoInput {
  base64Data: string;
  mimeType?: string;
}

// Type aliases are defined near enums above
