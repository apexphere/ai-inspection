import type { InspectionPhoto, PhotoSource } from '@prisma/client';

export interface CreateInspectionPhotoInput {
  projectId: string;
  inspectionId?: string;
  filePath: string;
  thumbnailPath?: string;
  filename: string;
  mimeType?: string;
  caption: string;
  source?: PhotoSource;
  takenAt?: Date;
  location?: { lat: number; lng: number };
  linkedClauses?: string[];
  linkedItemId?: string;
  linkedItemType?: 'ChecklistItem' | 'ClauseReview';
}

export interface UpdateInspectionPhotoInput {
  caption?: string;
  source?: PhotoSource;
  linkedClauses?: string[];
  linkedItemId?: string;
  linkedItemType?: 'ChecklistItem' | 'ClauseReview';
  sortOrder?: number;
}

export interface IInspectionPhotoRepository {
  create(input: CreateInspectionPhotoInput): Promise<InspectionPhoto>;
  findById(id: string): Promise<InspectionPhoto | null>;
  findByProjectId(projectId: string): Promise<InspectionPhoto[]>;
  findByInspectionId(inspectionId: string): Promise<InspectionPhoto[]>;
  update(id: string, input: UpdateInspectionPhotoInput): Promise<InspectionPhoto>;
  delete(id: string): Promise<void>;
  getNextReportNumber(projectId: string): Promise<number>;
  reorder(projectId: string, photoIds: string[]): Promise<void>;
}
