import type { ClauseReview, Applicability } from '@prisma/client';

export interface CreateClauseReviewInput {
  inspectionId: string;
  clauseId: string;
  applicability: Applicability;
  naReason?: string;
  observations?: string;
  photoIds?: string[];
  docIds?: string[];
  docsRequired?: string;
  remedialWorks?: string;
  sortOrder?: number;
}

export interface UpdateClauseReviewInput {
  applicability?: Applicability;
  naReason?: string;
  observations?: string;
  photoIds?: string[];
  docIds?: string[];
  docsRequired?: string;
  remedialWorks?: string;
  sortOrder?: number;
}

export interface ClauseReviewSearchParams {
  inspectionId?: string;
  applicability?: Applicability;
}

export interface ClauseReviewWithClause extends ClauseReview {
  clause: {
    id: string;
    code: string;
    title: string;
    category: string;
    performanceText: string;
    durabilityPeriod: string | null;
    typicalEvidence: string[];
  };
}

export interface IClauseReviewRepository {
  create(input: CreateClauseReviewInput): Promise<ClauseReviewWithClause>;
  findById(id: string): Promise<ClauseReviewWithClause | null>;
  findByInspectionId(inspectionId: string): Promise<ClauseReviewWithClause[]>;
  findByInspectionAndClause(inspectionId: string, clauseId: string): Promise<ClauseReviewWithClause | null>;
  findAll(params?: ClauseReviewSearchParams): Promise<ClauseReviewWithClause[]>;
  update(id: string, input: UpdateClauseReviewInput): Promise<ClauseReviewWithClause>;
  delete(id: string): Promise<void>;
  bulkCreate(reviews: CreateClauseReviewInput[]): Promise<ClauseReviewWithClause[]>;
  initializeForInspection(inspectionId: string, clauseIds: string[]): Promise<ClauseReviewWithClause[]>;
}
