// Applicability type is used implicitly via repository interface
import type {
  IClauseReviewRepository,
  CreateClauseReviewInput,
  UpdateClauseReviewInput,
  ClauseReviewSearchParams,
  ClauseReviewWithClause,
} from '../repositories/interfaces/clause-review.js';

export class ClauseReviewNotFoundError extends Error {
  constructor(id: string) {
    super(`Clause review not found: ${id}`);
    this.name = 'ClauseReviewNotFoundError';
  }
}

export interface ClauseReviewSummary {
  total: number;
  applicable: number;
  na: number;
  withObservations: number;
  withPhotos: number;
  withDocs: number;
  needingRemedialWorks: number;
  byCategory: Record<string, { applicable: number; na: number }>;
  completionPercentage: number;
}

export class ClauseReviewService {
  constructor(private repository: IClauseReviewRepository) {}

  async create(input: CreateClauseReviewInput): Promise<ClauseReviewWithClause> {
    return this.repository.create(input);
  }

  async findAll(params?: ClauseReviewSearchParams): Promise<ClauseReviewWithClause[]> {
    return this.repository.findAll(params);
  }

  async findById(id: string): Promise<ClauseReviewWithClause> {
    const review = await this.repository.findById(id);
    if (!review) {
      throw new ClauseReviewNotFoundError(id);
    }
    return review;
  }

  async findByInspectionId(inspectionId: string): Promise<ClauseReviewWithClause[]> {
    return this.repository.findByInspectionId(inspectionId);
  }

  async findByInspectionAndClause(inspectionId: string, clauseId: string): Promise<ClauseReviewWithClause | null> {
    return this.repository.findByInspectionAndClause(inspectionId, clauseId);
  }

  async update(id: string, input: UpdateClauseReviewInput): Promise<ClauseReviewWithClause> {
    await this.findById(id);
    return this.repository.update(id, input);
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.repository.delete(id);
  }

  async bulkCreate(reviews: CreateClauseReviewInput[]): Promise<ClauseReviewWithClause[]> {
    return this.repository.bulkCreate(reviews);
  }

  async initializeForInspection(inspectionId: string, clauseIds: string[]): Promise<ClauseReviewWithClause[]> {
    return this.repository.initializeForInspection(inspectionId, clauseIds);
  }

  async markAsNA(id: string, naReason: string): Promise<ClauseReviewWithClause> {
    return this.update(id, {
      applicability: 'NA',
      naReason,
    });
  }

  async markAsApplicable(id: string): Promise<ClauseReviewWithClause> {
    return this.update(id, {
      applicability: 'APPLICABLE',
      naReason: undefined,
    });
  }

  async addObservation(id: string, observation: string): Promise<ClauseReviewWithClause> {
    const review = await this.findById(id);
    const currentObservations = review.observations || '';
    const newObservations = currentObservations
      ? `${currentObservations}\n\n${observation}`
      : observation;
    
    return this.update(id, { observations: newObservations });
  }

  async getSummary(inspectionId: string): Promise<ClauseReviewSummary> {
    const reviews = await this.findByInspectionId(inspectionId);

    const summary: ClauseReviewSummary = {
      total: reviews.length,
      applicable: 0,
      na: 0,
      withObservations: 0,
      withPhotos: 0,
      withDocs: 0,
      needingRemedialWorks: 0,
      byCategory: {},
      completionPercentage: 0,
    };

    let reviewedCount = 0;

    for (const review of reviews) {
      const category = review.clause.category;

      // Initialize category if needed
      if (!summary.byCategory[category]) {
        summary.byCategory[category] = { applicable: 0, na: 0 };
      }

      // Count by applicability
      if (review.applicability === 'APPLICABLE') {
        summary.applicable++;
        summary.byCategory[category].applicable++;
      } else if (review.applicability === 'NA') {
        summary.na++;
        summary.byCategory[category].na++;
      }

      // Count other fields
      if (review.observations && review.observations.trim() !== '') {
        summary.withObservations++;
      }
      if (review.photoIds && review.photoIds.length > 0) {
        summary.withPhotos++;
      }
      if (review.docIds && review.docIds.length > 0) {
        summary.withDocs++;
      }
      if (review.remedialWorks && review.remedialWorks.trim() !== '') {
        summary.needingRemedialWorks++;
      }

      // Count as reviewed if has applicability set and (NA with reason OR applicable with observations)
      if (review.applicability === 'NA' && review.naReason) {
        reviewedCount++;
      } else if (review.applicability === 'APPLICABLE' && review.observations) {
        reviewedCount++;
      }
    }

    // Calculate completion percentage
    summary.completionPercentage = reviews.length > 0
      ? Math.round((reviewedCount / reviews.length) * 100)
      : 0;

    return summary;
  }

  async getGroupedByCategory(inspectionId: string): Promise<Record<string, ClauseReviewWithClause[]>> {
    const reviews = await this.findByInspectionId(inspectionId);
    
    const grouped: Record<string, ClauseReviewWithClause[]> = {};
    for (const review of reviews) {
      const category = review.clause.category;
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(review);
    }
    
    return grouped;
  }
}
