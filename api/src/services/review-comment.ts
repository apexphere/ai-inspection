/**
 * ReviewComment Service — Issue #211
 *
 * Business logic for review comments on reports.
 */

import type {
  IReviewCommentRepository,
  CreateReviewCommentData,
  UpdateReviewCommentData,
  ReviewCommentFilter,
} from '../repositories/interfaces/review-comment.js';
import type { ReviewComment } from '@prisma/client';

export class ReviewCommentNotFoundError extends Error {
  constructor(id: string) {
    super(`Review comment not found: ${id}`);
    this.name = 'ReviewCommentNotFoundError';
  }
}

export class ReviewCommentService {
  constructor(private repository: IReviewCommentRepository) {}

  async create(data: CreateReviewCommentData): Promise<ReviewComment> {
    return this.repository.create(data);
  }

  async getById(id: string): Promise<ReviewComment> {
    const comment = await this.repository.findById(id);
    if (!comment) throw new ReviewCommentNotFoundError(id);
    return comment;
  }

  async list(filter: ReviewCommentFilter): Promise<ReviewComment[]> {
    return this.repository.findByFilter(filter);
  }

  async update(id: string, data: UpdateReviewCommentData): Promise<ReviewComment> {
    // Verify exists
    await this.getById(id);
    return this.repository.update(id, data);
  }

  async resolve(id: string): Promise<ReviewComment> {
    await this.getById(id);
    return this.repository.update(id, { status: 'RESOLVED' });
  }

  async reopen(id: string): Promise<ReviewComment> {
    await this.getById(id);
    return this.repository.update(id, { status: 'OPEN' });
  }

  async delete(id: string): Promise<void> {
    await this.getById(id);
    return this.repository.delete(id);
  }
}
