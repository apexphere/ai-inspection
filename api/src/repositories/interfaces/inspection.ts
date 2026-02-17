import type { Inspection, Finding, Photo, Report, Status, Severity, Prisma } from '@prisma/client';

export interface CreateInspectionInput {
  address: string;
  clientName: string;
  inspectorName?: string;
  checklistId: string;
  currentSection: string;
  metadata?: Prisma.InputJsonValue;
}

export interface UpdateInspectionInput {
  address?: string;
  clientName?: string;
  inspectorName?: string;
  status?: Status;
  currentSection?: string;
  metadata?: Prisma.InputJsonValue;
  completedAt?: Date;
}

export interface CreateFindingInput {
  inspectionId: string;
  section: string;
  text: string;
  severity?: Severity;
  matchedComment?: string;
}

export interface UpdateFindingInput {
  text?: string;
  severity?: Severity;
  matchedComment?: string;
}

export interface CreatePhotoInput {
  findingId: string;
  filename: string;
  path: string;
  mimeType: string;
}

export interface CreateReportInput {
  inspectionId: string;
  format?: string;
  path: string;
}

export interface IInspectionRepository {
  // Inspections
  create(input: CreateInspectionInput): Promise<Inspection>;
  findById(id: string): Promise<Inspection | null>;
  findAll(): Promise<Inspection[]>;
  update(id: string, input: UpdateInspectionInput): Promise<Inspection>;
  delete(id: string): Promise<void>;
  
  // Findings
  createFinding(input: CreateFindingInput): Promise<Finding>;
  findFindingById(id: string): Promise<Finding | null>;
  findFindingsByInspection(inspectionId: string): Promise<Finding[]>;
  updateFinding(id: string, input: UpdateFindingInput): Promise<Finding>;
  deleteFinding(id: string): Promise<void>;
  
  // Photos
  createPhoto(input: CreatePhotoInput): Promise<Photo>;
  findPhotoById(id: string): Promise<Photo | null>;
  findPhotosByFinding(findingId: string): Promise<Photo[]>;
  deletePhoto(id: string): Promise<void>;
  
  // Reports
  createReport(input: CreateReportInput): Promise<Report>;
  findReportById(id: string): Promise<Report | null>;
  findReportsByInspection(inspectionId: string): Promise<Report[]>;
}
