/**
 * ReviewComment Repository Interface — Issue #211
 */

import type { ReviewComment } from '@prisma/client';

export interface CreateReviewCommentData {
  reportId: string;
  authorId: string;
  section?: string;
  content: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface UpdateReviewCommentData {
  content?: string;
  section?: string | null;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  status?: 'OPEN' | 'RESOLVED';
}

export interface ReviewCommentFilter {
  reportId: string;
  status?: 'OPEN' | 'RESOLVED';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  authorId?: string;
}

export interface IReviewCommentRepository {
  create(data: CreateReviewCommentData): Promise<ReviewComment>;
  findById(id: string): Promise<ReviewComment | null>;
  findByFilter(filter: ReviewCommentFilter): Promise<ReviewComment[]>;
  update(id: string, data: UpdateReviewCommentData): Promise<ReviewComment>;
  delete(id: string): Promise<void>;
}
