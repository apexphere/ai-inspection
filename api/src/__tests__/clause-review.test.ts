import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ClauseReviewService,
  ClauseReviewNotFoundError,
} from '../services/clause-review.js';
import type { IClauseReviewRepository, ClauseReviewWithClause } from '../repositories/interfaces/clause-review.js';

// Mock repository
const createMockRepository = (): IClauseReviewRepository => ({
  create: vi.fn(),
  findById: vi.fn(),
  findByInspectionId: vi.fn(),
  findByInspectionAndClause: vi.fn(),
  findAll: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  bulkCreate: vi.fn(),
  initializeForInspection: vi.fn(),
});

const mockClauseReview: ClauseReviewWithClause = {
  id: 'review-1',
  inspectionId: 'insp-1',
  clauseId: 'clause-1',
  applicability: 'APPLICABLE',
  naReason: null,
  observations: 'Foundations look good',
  photoIds: ['photo-1'],
  docIds: [],
  docsRequired: null,
  remedialWorks: null,
  sortOrder: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  clause: {
    id: 'clause-1',
    code: 'B1',
    title: 'Structure',
    category: 'B',
    performanceText: 'Buildings shall withstand loads...',
    durabilityPeriod: 'FIFTY_YEARS',
    typicalEvidence: ['PS1', 'PS3'],
  },
};

describe('ClauseReviewService', () => {
  let repository: IClauseReviewRepository;
  let service: ClauseReviewService;

  beforeEach(() => {
    repository = createMockRepository();
    service = new ClauseReviewService(repository);
  });

  describe('create', () => {
    it('should create a clause review', async () => {
      vi.mocked(repository.create).mockResolvedValue(mockClauseReview);

      const result = await service.create({
        inspectionId: 'insp-1',
        clauseId: 'clause-1',
        applicability: 'APPLICABLE',
      });

      expect(repository.create).toHaveBeenCalled();
      expect(result).toEqual(mockClauseReview);
    });
  });

  describe('findById', () => {
    it('should return review by id', async () => {
      vi.mocked(repository.findById).mockResolvedValue(mockClauseReview);

      const result = await service.findById('review-1');
      expect(result).toEqual(mockClauseReview);
    });

    it('should throw ClauseReviewNotFoundError for non-existent review', async () => {
      vi.mocked(repository.findById).mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(
        ClauseReviewNotFoundError
      );
    });
  });

  describe('findByInspectionId', () => {
    it('should return all reviews for inspection', async () => {
      vi.mocked(repository.findByInspectionId).mockResolvedValue([mockClauseReview]);

      const result = await service.findByInspectionId('insp-1');
      expect(result).toEqual([mockClauseReview]);
    });
  });

  describe('update', () => {
    it('should update clause review', async () => {
      const updatedReview = { ...mockClauseReview, observations: 'Updated observations' };
      vi.mocked(repository.findById).mockResolvedValue(mockClauseReview);
      vi.mocked(repository.update).mockResolvedValue(updatedReview);

      const result = await service.update('review-1', { observations: 'Updated observations' });
      expect(result.observations).toBe('Updated observations');
    });

    it('should throw ClauseReviewNotFoundError for non-existent review', async () => {
      vi.mocked(repository.findById).mockResolvedValue(null);

      await expect(
        service.update('non-existent', { observations: 'Test' })
      ).rejects.toThrow(ClauseReviewNotFoundError);
    });
  });

  describe('delete', () => {
    it('should delete existing review', async () => {
      vi.mocked(repository.findById).mockResolvedValue(mockClauseReview);
      vi.mocked(repository.delete).mockResolvedValue();

      await expect(service.delete('review-1')).resolves.toBeUndefined();
      expect(repository.delete).toHaveBeenCalledWith('review-1');
    });

    it('should throw ClauseReviewNotFoundError for non-existent review', async () => {
      vi.mocked(repository.findById).mockResolvedValue(null);

      await expect(service.delete('non-existent')).rejects.toThrow(
        ClauseReviewNotFoundError
      );
    });
  });

  describe('markAsNA', () => {
    it('should mark review as N/A with reason', async () => {
      const naReview = { ...mockClauseReview, applicability: 'NA' as const, naReason: 'Not in scope' };
      vi.mocked(repository.findById).mockResolvedValue(mockClauseReview);
      vi.mocked(repository.update).mockResolvedValue(naReview);

      const result = await service.markAsNA('review-1', 'Not in scope');
      expect(result.applicability).toBe('NA');
      expect(result.naReason).toBe('Not in scope');
    });
  });

  describe('markAsApplicable', () => {
    it('should mark review as applicable', async () => {
      const naReview = { ...mockClauseReview, applicability: 'NA' as const, naReason: 'Some reason' };
      const applicableReview = { ...mockClauseReview, applicability: 'APPLICABLE' as const, naReason: null };
      vi.mocked(repository.findById).mockResolvedValue(naReview);
      vi.mocked(repository.update).mockResolvedValue(applicableReview);

      const result = await service.markAsApplicable('review-1');
      expect(result.applicability).toBe('APPLICABLE');
    });
  });

  describe('getSummary', () => {
    it('should calculate summary correctly', async () => {
      const reviews: ClauseReviewWithClause[] = [
        { ...mockClauseReview, id: 'r1', applicability: 'APPLICABLE', observations: 'Obs', naReason: null, photoIds: [], remedialWorks: null },
        { ...mockClauseReview, id: 'r2', applicability: 'APPLICABLE', observations: null, naReason: null, photoIds: [], remedialWorks: null },
        { ...mockClauseReview, id: 'r3', applicability: 'NA', naReason: 'Not in scope', observations: null, photoIds: [], remedialWorks: null },
        { ...mockClauseReview, id: 'r4', applicability: 'APPLICABLE', observations: 'Done', photoIds: ['p1'], remedialWorks: 'Fix needed', naReason: null },
      ];
      vi.mocked(repository.findByInspectionId).mockResolvedValue(reviews);

      const summary = await service.getSummary('insp-1');

      expect(summary.total).toBe(4);
      expect(summary.applicable).toBe(3);
      expect(summary.na).toBe(1);
      expect(summary.withObservations).toBe(2);
      expect(summary.withPhotos).toBe(1);
      expect(summary.needingRemedialWorks).toBe(1);
    });

    it('should group by category', async () => {
      const reviewB = { ...mockClauseReview, id: 'r1', clause: { ...mockClauseReview.clause, category: 'B' } };
      const reviewE = { ...mockClauseReview, id: 'r2', applicability: 'NA' as const, clause: { ...mockClauseReview.clause, category: 'E' } };
      vi.mocked(repository.findByInspectionId).mockResolvedValue([reviewB, reviewE]);

      const summary = await service.getSummary('insp-1');

      expect(summary.byCategory['B']).toEqual({ applicable: 1, na: 0 });
      expect(summary.byCategory['E']).toEqual({ applicable: 0, na: 1 });
    });
  });

  describe('getGroupedByCategory', () => {
    it('should group reviews by clause category', async () => {
      const reviewB = { ...mockClauseReview, id: 'r1', clause: { ...mockClauseReview.clause, category: 'B' } };
      const reviewE = { ...mockClauseReview, id: 'r2', clause: { ...mockClauseReview.clause, category: 'E' } };
      vi.mocked(repository.findByInspectionId).mockResolvedValue([reviewB, reviewE]);

      const grouped = await service.getGroupedByCategory('insp-1');

      expect(grouped['B']).toHaveLength(1);
      expect(grouped['E']).toHaveLength(1);
    });
  });

  describe('initializeForInspection', () => {
    it('should initialize clause reviews for inspection', async () => {
      vi.mocked(repository.initializeForInspection).mockResolvedValue([mockClauseReview]);

      const result = await service.initializeForInspection('insp-1', ['clause-1']);
      expect(repository.initializeForInspection).toHaveBeenCalledWith('insp-1', ['clause-1']);
      expect(result).toHaveLength(1);
    });
  });
});
