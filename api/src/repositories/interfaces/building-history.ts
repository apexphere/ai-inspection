import type { BuildingHistory, BuildingHistoryType, BuildingHistoryStatus } from '@prisma/client';

export interface CreateBuildingHistoryInput {
  propertyId: string;
  type: BuildingHistoryType;
  reference: string;
  year: number;
  status?: BuildingHistoryStatus;
  description?: string;
  issuer?: string;
  issuedAt?: Date;
}

export interface UpdateBuildingHistoryInput {
  type?: BuildingHistoryType;
  reference?: string;
  year?: number;
  status?: BuildingHistoryStatus;
  description?: string;
  issuer?: string;
  issuedAt?: Date | null;
  sortOrder?: number;
}

export interface IBuildingHistoryRepository {
  create(input: CreateBuildingHistoryInput): Promise<BuildingHistory>;
  findById(id: string): Promise<BuildingHistory | null>;
  findByPropertyId(propertyId: string): Promise<BuildingHistory[]>;
  update(id: string, input: UpdateBuildingHistoryInput): Promise<BuildingHistory>;
  delete(id: string): Promise<void>;
}
