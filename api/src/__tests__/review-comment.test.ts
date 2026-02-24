/**
 * ReviewComment Tests — Issue #211
 *
 * Tests for review comments service and routes.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ──────────────────────────────────────────────────────────────────────────────
// Hoist mock references
// ──────────────────────────────────────────────────────────────────────────────
const {
  mockCreate,
  mockFindUnique,
  mockFindMany,
  mockUpdate,
  mockDelete,
} = vi.hoisted(() => ({
  mockCreate: vi.fn(),
  mockFindUnique: vi.fn(),
  mockFindMany: vi.fn(),
  mockUpdate: vi.fn(),
  mockDelete: vi.fn(),
}));

// Mock PrismaClient
vi.mock('@prisma/client', () => ({
  PrismaClient: class {
    reviewComment = {
      create: mockCreate,
      findUnique: mockFindUnique,
      findMany: mockFindMany,
      update: mockUpdate,
      delete: mockDelete,
    };
  },
}));

import { PrismaClient } from '@prisma/client';
import { PrismaReviewCommentRepository } from '../repositories/prisma/review-comment.js';
import { ReviewCommentService, ReviewCommentNotFoundError } from '../services/review-comment.js';

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────
function makeComment(overrides: Record<string, unknown> = {}) {
  return {
    id: 'comment-1',
    reportId: 'report-1',
    authorId: 'user-1',
    section: 'findings',
    content: 'This section needs more detail',
    priority: 'MEDIUM',
    status: 'OPEN',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Repository Tests
// ──────────────────────────────────────────────────────────────────────────────
describe('PrismaReviewCommentRepository', () => {
  let repo: PrismaReviewCommentRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new PrismaReviewCommentRepository(new PrismaClient());
  });

  it('creates a review comment', async () => {
    const comment = makeComment();
    mockCreate.mockResolvedValue(comment);

    const result = await repo.create({
      reportId: 'report-1',
      authorId: 'user-1',
      section: 'findings',
      content: 'This section needs more detail',
    });

    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        reportId: 'report-1',
        authorId: 'user-1',
        section: 'findings',
        content: 'This section needs more detail',
        priority: 'MEDIUM',
      },
    });
    expect(result.id).toBe('comment-1');
  });

  it('creates with default priority when not specified', async () => {
    mockCreate.mockResolvedValue(makeComment());

    await repo.create({
      reportId: 'report-1',
      authorId: 'user-1',
      content: 'General comment',
    });

    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ priority: 'MEDIUM', section: null }),
    });
  });

  it('finds by filter with all params', async () => {
    mockFindMany.mockResolvedValue([makeComment()]);

    await repo.findByFilter({
      reportId: 'report-1',
      status: 'OPEN',
      priority: 'HIGH',
      authorId: 'user-1',
    });

    expect(mockFindMany).toHaveBeenCalledWith({
      where: {
        reportId: 'report-1',
        status: 'OPEN',
        priority: 'HIGH',
        authorId: 'user-1',
      },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('finds by filter with only reportId', async () => {
    mockFindMany.mockResolvedValue([]);

    await repo.findByFilter({ reportId: 'report-1' });

    expect(mockFindMany).toHaveBeenCalledWith({
      where: { reportId: 'report-1' },
      orderBy: { createdAt: 'desc' },
    });
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Service Tests
// ──────────────────────────────────────────────────────────────────────────────
describe('ReviewCommentService', () => {
  let service: ReviewCommentService;

  beforeEach(() => {
    vi.clearAllMocks();
    const prisma = new PrismaClient();
    const repo = new PrismaReviewCommentRepository(prisma);
    service = new ReviewCommentService(repo);
  });

  describe('create', () => {
    it('creates a comment', async () => {
      const comment = makeComment();
      mockCreate.mockResolvedValue(comment);

      const result = await service.create({
        reportId: 'report-1',
        authorId: 'user-1',
        content: 'Needs more detail',
      });

      expect(result.id).toBe('comment-1');
    });
  });

  describe('getById', () => {
    it('returns comment when found', async () => {
      mockFindUnique.mockResolvedValue(makeComment());
      const result = await service.getById('comment-1');
      expect(result.id).toBe('comment-1');
    });

    it('throws ReviewCommentNotFoundError when not found', async () => {
      mockFindUnique.mockResolvedValue(null);
      await expect(service.getById('missing')).rejects.toThrow(ReviewCommentNotFoundError);
    });
  });

  describe('list', () => {
    it('returns filtered comments', async () => {
      const comments = [makeComment(), makeComment({ id: 'comment-2' })];
      mockFindMany.mockResolvedValue(comments);

      const result = await service.list({ reportId: 'report-1', status: 'OPEN' });
      expect(result).toHaveLength(2);
    });
  });

  describe('update', () => {
    it('updates an existing comment', async () => {
      mockFindUnique.mockResolvedValue(makeComment());
      mockUpdate.mockResolvedValue(makeComment({ content: 'Updated' }));

      const result = await service.update('comment-1', { content: 'Updated' });
      expect(result.content).toBe('Updated');
    });

    it('throws when comment not found', async () => {
      mockFindUnique.mockResolvedValue(null);
      await expect(service.update('missing', { content: 'x' })).rejects.toThrow(ReviewCommentNotFoundError);
    });
  });

  describe('resolve', () => {
    it('sets status to RESOLVED', async () => {
      mockFindUnique.mockResolvedValue(makeComment());
      mockUpdate.mockResolvedValue(makeComment({ status: 'RESOLVED' }));

      const result = await service.resolve('comment-1');
      expect(result.status).toBe('RESOLVED');
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 'comment-1' },
        data: { status: 'RESOLVED' },
      });
    });
  });

  describe('reopen', () => {
    it('sets status to OPEN', async () => {
      mockFindUnique.mockResolvedValue(makeComment({ status: 'RESOLVED' }));
      mockUpdate.mockResolvedValue(makeComment({ status: 'OPEN' }));

      const result = await service.reopen('comment-1');
      expect(result.status).toBe('OPEN');
    });
  });

  describe('delete', () => {
    it('deletes an existing comment', async () => {
      mockFindUnique.mockResolvedValue(makeComment());
      mockDelete.mockResolvedValue(makeComment());

      await service.delete('comment-1');
      expect(mockDelete).toHaveBeenCalledWith({ where: { id: 'comment-1' } });
    });

    it('throws when comment not found', async () => {
      mockFindUnique.mockResolvedValue(null);
      await expect(service.delete('missing')).rejects.toThrow(ReviewCommentNotFoundError);
    });
  });
});
