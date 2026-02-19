import type { BuildingCodeClause, ClauseCategory, DurabilityPeriod } from '@prisma/client';

export interface CreateBuildingCodeClauseInput {
  code: string;
  title: string;
  category: ClauseCategory;
  objective?: string;
  functionalReq?: string;
  performanceText: string;
  durabilityPeriod?: DurabilityPeriod;
  typicalEvidence?: string[];
  sortOrder?: number;
  parentId?: string;
}

export interface UpdateBuildingCodeClauseInput {
  code?: string;
  title?: string;
  category?: ClauseCategory;
  objective?: string;
  functionalReq?: string;
  performanceText?: string;
  durabilityPeriod?: DurabilityPeriod;
  typicalEvidence?: string[];
  sortOrder?: number;
  parentId?: string;
}

export interface BuildingCodeClauseSearchParams {
  category?: ClauseCategory;
  keyword?: string;
  parentId?: string | null;
}

export interface IBuildingCodeClauseRepository {
  create(input: CreateBuildingCodeClauseInput): Promise<BuildingCodeClause>;
  findById(id: string): Promise<BuildingCodeClause | null>;
  findByCode(code: string): Promise<BuildingCodeClause | null>;
  findAll(params?: BuildingCodeClauseSearchParams): Promise<BuildingCodeClause[]>;
  findByCategory(category: ClauseCategory): Promise<BuildingCodeClause[]>;
  findTopLevel(): Promise<BuildingCodeClause[]>;
  findChildren(parentId: string): Promise<BuildingCodeClause[]>;
  update(id: string, input: UpdateBuildingCodeClauseInput): Promise<BuildingCodeClause>;
  delete(id: string): Promise<void>;
  bulkCreate(clauses: CreateBuildingCodeClauseInput[]): Promise<BuildingCodeClause[]>;
}
