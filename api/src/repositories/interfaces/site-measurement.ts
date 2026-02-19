import type { SiteMeasurement, MeasurementType, MeasurementUnit, MeasurementResult } from '@prisma/client';

export interface CreateSiteMeasurementInput {
  inspectionId: string;
  type: MeasurementType;
  location: string;
  value: number;
  unit: MeasurementUnit;
  linkedClauseId?: string;
  notes?: string;
}

export interface UpdateSiteMeasurementInput {
  type?: MeasurementType;
  location?: string;
  value?: number;
  unit?: MeasurementUnit;
  result?: MeasurementResult;
  linkedClauseId?: string | null;
  notes?: string;
  sortOrder?: number;
}

export interface SiteMeasurementWithClause extends SiteMeasurement {
  linkedClause?: {
    id: string;
    code: string;
    title: string;
  } | null;
}

export interface ISiteMeasurementRepository {
  create(input: CreateSiteMeasurementInput): Promise<SiteMeasurementWithClause>;
  findById(id: string): Promise<SiteMeasurementWithClause | null>;
  findByInspectionId(inspectionId: string): Promise<SiteMeasurementWithClause[]>;
  update(id: string, input: UpdateSiteMeasurementInput): Promise<SiteMeasurementWithClause>;
  delete(id: string): Promise<void>;
}
