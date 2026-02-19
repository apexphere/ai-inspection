import { PrismaClient } from '@prisma/client';
import type {
  IClauseReviewRepository,
  CreateClauseReviewInput,
  UpdateClauseReviewInput,
  ClauseReviewSearchParams,
  ClauseReviewWithClause,
} from '../interfaces/clause-review.js';

const clauseInclude = {
  clause: {
    select: {
      id: true,
      code: true,
      title: true,
      category: true,
      performanceText: true,
      durabilityPeriod: true,
      typicalEvidence: true,
    },
  },
};

export class PrismaClauseReviewRepository implements IClauseReviewRepository {
  constructor(private prisma: PrismaClient) {}

  async create(input: CreateClauseReviewInput): Promise<ClauseReviewWithClause> {
    return this.prisma.clauseReview.create({
      data: input,
      include: clauseInclude,
    }) as Promise<ClauseReviewWithClause>;
  }

  async findById(id: string): Promise<ClauseReviewWithClause | null> {
    return this.prisma.clauseReview.findUnique({
      where: { id },
      include: clauseInclude,
    }) as Promise<ClauseReviewWithClause | null>;
  }

  async findByInspectionId(inspectionId: string): Promise<ClauseReviewWithClause[]> {
    return this.prisma.clauseReview.findMany({
      where: { inspectionId },
      include: clauseInclude,
      orderBy: [
        { clause: { category: 'asc' } },
        { sortOrder: 'asc' },
      ],
    }) as Promise<ClauseReviewWithClause[]>;
  }

  async findByInspectionAndClause(inspectionId: string, clauseId: string): Promise<ClauseReviewWithClause | null> {
    return this.prisma.clauseReview.findUnique({
      where: {
        inspectionId_clauseId: { inspectionId, clauseId },
      },
      include: clauseInclude,
    }) as Promise<ClauseReviewWithClause | null>;
  }

  async findAll(params?: ClauseReviewSearchParams): Promise<ClauseReviewWithClause[]> {
    const where: Record<string, unknown> = {};

    if (params?.inspectionId) {
      where.inspectionId = params.inspectionId;
    }
    if (params?.applicability) {
      where.applicability = params.applicability;
    }

    return this.prisma.clauseReview.findMany({
      where,
      include: clauseInclude,
      orderBy: [
        { clause: { category: 'asc' } },
        { sortOrder: 'asc' },
      ],
    }) as Promise<ClauseReviewWithClause[]>;
  }

  async update(id: string, input: UpdateClauseReviewInput): Promise<ClauseReviewWithClause> {
    return this.prisma.clauseReview.update({
      where: { id },
      data: input,
      include: clauseInclude,
    }) as Promise<ClauseReviewWithClause>;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.clauseReview.delete({
      where: { id },
    });
  }

  async bulkCreate(reviews: CreateClauseReviewInput[]): Promise<ClauseReviewWithClause[]> {
    return this.prisma.$transaction(
      reviews.map((review) =>
        this.prisma.clauseReview.create({
          data: review,
          include: clauseInclude,
        })
      )
    ) as Promise<ClauseReviewWithClause[]>;
  }

  async initializeForInspection(inspectionId: string, clauseIds: string[]): Promise<ClauseReviewWithClause[]> {
    // Create clause reviews for all provided clauses with default applicability
    const reviews = clauseIds.map((clauseId, index) => ({
      inspectionId,
      clauseId,
      applicability: 'APPLICABLE' as const,
      sortOrder: index,
    }));

    return this.bulkCreate(reviews);
  }
}
