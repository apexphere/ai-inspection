/**
 * Defect Repository Interface — Issue #218
 */

import type { Defect } from '@prisma/client';

export interface CreateDefectData {
  inspectionId: string;
  defectNumber: string;
  location: string;
  element: string;
  description: string;
  cause?: string;
  remedialAction?: string;
  priority?: string;
  linkedClauseId?: string;
  photoIds?: string[];
  sortOrder?: number;
}

export interface UpdateDefectData {
  location?: string;
  element?: string;
  description?: string;
  cause?: string | null;
  remedialAction?: string | null;
  priority?: string;
  linkedClauseId?: string | null;
  photoIds?: string[];
  sortOrder?: number;
}

export interface IDefectRepository {
  create(data: CreateDefectData): Promise<Defect>;
  findById(id: string): Promise<Defect | null>;
  findByInspectionId(inspectionId: string): Promise<Defect[]>;
  update(id: string, data: UpdateDefectData): Promise<Defect>;
  delete(id: string): Promise<void>;
  countByInspectionId(inspectionId: string): Promise<number>;
}
