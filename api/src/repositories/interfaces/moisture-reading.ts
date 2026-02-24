import type { MoistureReading, MoistureResult } from '@prisma/client';

export interface CreateMoistureReadingInput {
  inspectionId: string;
  location: string;
  substrate?: string;
  reading: number;
  depth?: number;
  result?: MoistureResult;
  defectId?: string;
  linkedClauseId?: string;
  notes?: string;
  takenAt?: Date;
  sortOrder?: number;
}

export interface UpdateMoistureReadingInput {
  location?: string;
  substrate?: string | null;
  reading?: number;
  depth?: number | null;
  result?: MoistureResult;
  defectId?: string | null;
  linkedClauseId?: string | null;
  notes?: string | null;
  takenAt?: Date | null;
  sortOrder?: number;
}

export interface MoistureReadingSearchParams {
  inspectionId?: string;
  result?: MoistureResult;
  defectId?: string;
}

export interface IMoistureReadingRepository {
  create(input: CreateMoistureReadingInput): Promise<MoistureReading>;
  findById(id: string): Promise<MoistureReading | null>;
  findByInspectionId(inspectionId: string): Promise<MoistureReading[]>;
  findAll(params?: MoistureReadingSearchParams): Promise<MoistureReading[]>;
  update(id: string, input: UpdateMoistureReadingInput): Promise<MoistureReading>;
  delete(id: string): Promise<void>;
}
