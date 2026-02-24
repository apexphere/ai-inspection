/**
 * Prisma ReviewComment Repository — Issue #211
 */

import type { PrismaClient, ReviewComment } from '@prisma/client';
import type {
  IReviewCommentRepository,
  CreateReviewCommentData,
  UpdateReviewCommentData,
  ReviewCommentFilter,
} from '../interfaces/review-comment.js';

export class PrismaReviewCommentRepository implements IReviewCommentRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreateReviewCommentData): Promise<ReviewComment> {
    return this.prisma.reviewComment.create({
      data: {
        reportId: data.reportId,
        authorId: data.authorId,
        section: data.section ?? null,
        content: data.content,
        priority: data.priority ?? 'MEDIUM',
      },
    });
  }

  async findById(id: string): Promise<ReviewComment | null> {
    return this.prisma.reviewComment.findUnique({ where: { id } });
  }

  async findByFilter(filter: ReviewCommentFilter): Promise<ReviewComment[]> {
    return this.prisma.reviewComment.findMany({
      where: {
        reportId: filter.reportId,
        ...(filter.status && { status: filter.status }),
        ...(filter.priority && { priority: filter.priority }),
        ...(filter.authorId && { authorId: filter.authorId }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, data: UpdateReviewCommentData): Promise<ReviewComment> {
    return this.prisma.reviewComment.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.reviewComment.delete({ where: { id } });
  }
}
