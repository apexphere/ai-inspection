/**
 * GenerationQueueService Tests — Issue #225
 *
 * Tests for the background job queue service:
 * enqueue, getStatus, getLatestByInspection, cancel, and error cases.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ──────────────────────────────────────────────────────────────────────────────
// Hoist mock references
// ──────────────────────────────────────────────────────────────────────────────
const {
  mockFindFirst,
  mockCreate,
  mockUpdate,
  mockFindUnique,
  mockQueueAdd,
  mockBullJobRemove,
  mockQueueGetJob,
} = vi.hoisted(() => ({
  mockFindFirst: vi.fn(),
  mockCreate: vi.fn(),
  mockUpdate: vi.fn(),
  mockFindUnique: vi.fn(),
  mockQueueAdd: vi.fn(),
  mockBullJobRemove: vi.fn(),
  mockQueueGetJob: vi.fn(),
}));

// Mock PrismaClient
vi.mock('@prisma/client', () => ({
  PrismaClient: class {
    generationJob = {
      findFirst: mockFindFirst,
      create: mockCreate,
      update: mockUpdate,
      findUnique: mockFindUnique,
    };
  },
}));

// Import after mocks
import { PrismaClient } from '@prisma/client';
import { GenerationQueueService, JobNotFoundError, JobAlreadyActiveError } from '../services/generation-queue.js';
import type { Queue } from 'bullmq';
import type { GenerationJobData } from '../services/generation-queue.js';

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────
function makeDbJob(overrides: Record<string, unknown> = {}) {
  return {
    id: 'job-1',
    inspectionId: 'insp-1',
    bullJobId: 'bull-1',
    status: 'PENDING',
    progress: 0,
    error: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}

/** Creates a mock BullMQ queue for DI */
function makeMockQueue() {
  return {
    add: mockQueueAdd,
    getJob: mockQueueGetJob,
  } as unknown as Queue<GenerationJobData>;
}

// ──────────────────────────────────────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────────────────────────────────────
describe('GenerationQueueService', () => {
  let service: GenerationQueueService;
  let prisma: InstanceType<typeof PrismaClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = new PrismaClient();
    service = new GenerationQueueService(prisma, () => makeMockQueue());
  });

  // ────────────────────────────────────────────────────────────────────────────
  describe('enqueue', () => {
    it('creates a DB job and enqueues in BullMQ', async () => {
      const dbJob = makeDbJob();
      mockFindFirst.mockResolvedValue(null); // no active job
      mockCreate.mockResolvedValue(dbJob);
      mockQueueAdd.mockResolvedValue({ id: 'bull-1' });
      mockUpdate.mockResolvedValue({ ...dbJob, bullJobId: 'bull-1' });

      const result = await service.enqueue('insp-1');

      expect(mockFindFirst).toHaveBeenCalledWith({
        where: {
          inspectionId: 'insp-1',
          status: { in: ['PENDING', 'PROCESSING', 'RETRYING'] },
        },
      });
      expect(mockCreate).toHaveBeenCalledWith({
        data: { inspectionId: 'insp-1', status: 'PENDING', progress: 0 },
      });
      expect(mockQueueAdd).toHaveBeenCalledWith(
        'generate',
        { inspectionId: 'insp-1', dbJobId: 'job-1' },
        { jobId: 'job-1' }
      );
      expect(result).toEqual({ jobId: 'job-1', status: 'PENDING' });
    });

    it('throws JobAlreadyActiveError when a PENDING job exists', async () => {
      mockFindFirst.mockResolvedValue(makeDbJob({ status: 'PENDING' }));

      await expect(service.enqueue('insp-1')).rejects.toThrow(JobAlreadyActiveError);
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('throws JobAlreadyActiveError when a PROCESSING job exists', async () => {
      mockFindFirst.mockResolvedValue(makeDbJob({ status: 'PROCESSING' }));

      await expect(service.enqueue('insp-1')).rejects.toThrow(JobAlreadyActiveError);
    });

    it('throws JobAlreadyActiveError when a RETRYING job exists', async () => {
      mockFindFirst.mockResolvedValue(makeDbJob({ status: 'RETRYING' }));

      await expect(service.enqueue('insp-1')).rejects.toThrow(JobAlreadyActiveError);
    });

    it('allows enqueue when previous job is COMPLETED', async () => {
      mockFindFirst.mockResolvedValue(null); // no active job
      mockCreate.mockResolvedValue(makeDbJob());
      mockQueueAdd.mockResolvedValue({ id: 'bull-2' });
      mockUpdate.mockResolvedValue(makeDbJob({ bullJobId: 'bull-2' }));

      const result = await service.enqueue('insp-1');
      expect(result.status).toBe('PENDING');
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  describe('getStatus', () => {
    it('returns job details when found', async () => {
      const dbJob = makeDbJob({ status: 'PROCESSING', progress: 50 });
      mockFindUnique.mockResolvedValue(dbJob);

      const result = await service.getStatus('job-1');

      expect(result).toMatchObject({
        jobId: 'job-1',
        inspectionId: 'insp-1',
        status: 'PROCESSING',
        progress: 50,
        error: null,
      });
    });

    it('includes error message when job failed', async () => {
      const dbJob = makeDbJob({ status: 'FAILED', error: 'Template not found' });
      mockFindUnique.mockResolvedValue(dbJob);

      const result = await service.getStatus('job-1');
      expect(result.status).toBe('FAILED');
      expect(result.error).toBe('Template not found');
    });

    it('throws JobNotFoundError when job does not exist', async () => {
      mockFindUnique.mockResolvedValue(null);

      await expect(service.getStatus('missing-id')).rejects.toThrow(JobNotFoundError);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  describe('getLatestByInspection', () => {
    it('returns the latest job for an inspection', async () => {
      const dbJob = makeDbJob({ status: 'COMPLETED', progress: 100 });
      mockFindFirst.mockResolvedValue(dbJob);

      const result = await service.getLatestByInspection('insp-1');

      expect(result).not.toBeNull();
      expect(result!.status).toBe('COMPLETED');
      expect(result!.progress).toBe(100);
    });

    it('returns null when no jobs exist for inspection', async () => {
      mockFindFirst.mockResolvedValue(null);

      const result = await service.getLatestByInspection('insp-1');
      expect(result).toBeNull();
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  describe('cancel', () => {
    it('cancels a PENDING job and removes it from the BullMQ queue', async () => {
      const dbJob = makeDbJob({ status: 'PENDING', bullJobId: 'bull-1' });
      mockFindUnique.mockResolvedValue(dbJob);
      mockQueueGetJob.mockResolvedValue({ remove: mockBullJobRemove });
      mockUpdate.mockResolvedValue({ ...dbJob, status: 'CANCELLED' });

      await service.cancel('job-1');

      expect(mockQueueGetJob).toHaveBeenCalledWith('bull-1');
      expect(mockBullJobRemove).toHaveBeenCalled();
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 'job-1' },
        data: { status: 'CANCELLED' },
      });
    });

    it('throws JobNotFoundError when job does not exist', async () => {
      mockFindUnique.mockResolvedValue(null);

      await expect(service.cancel('missing-id')).rejects.toThrow(JobNotFoundError);
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('throws error when trying to cancel a PROCESSING job', async () => {
      mockFindUnique.mockResolvedValue(makeDbJob({ status: 'PROCESSING' }));

      await expect(service.cancel('job-1')).rejects.toThrow(
        'Cannot cancel job in status: PROCESSING'
      );
    });

    it('throws error when trying to cancel a COMPLETED job', async () => {
      mockFindUnique.mockResolvedValue(makeDbJob({ status: 'COMPLETED' }));

      await expect(service.cancel('job-1')).rejects.toThrow(
        'Cannot cancel job in status: COMPLETED'
      );
    });

    it('still updates DB to CANCELLED even if BullMQ job not found in queue', async () => {
      const dbJob = makeDbJob({ status: 'PENDING', bullJobId: 'bull-1' });
      mockFindUnique.mockResolvedValue(dbJob);
      mockQueueGetJob.mockResolvedValue(null); // job gone from queue
      mockUpdate.mockResolvedValue({ ...dbJob, status: 'CANCELLED' });

      await service.cancel('job-1');

      expect(mockBullJobRemove).not.toHaveBeenCalled();
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 'job-1' },
        data: { status: 'CANCELLED' },
      });
    });

    it('cancels without BullMQ call when bullJobId is null', async () => {
      const dbJob = makeDbJob({ status: 'PENDING', bullJobId: null });
      mockFindUnique.mockResolvedValue(dbJob);
      mockUpdate.mockResolvedValue({ ...dbJob, status: 'CANCELLED' });

      await service.cancel('job-1');

      expect(mockQueueGetJob).not.toHaveBeenCalled();
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 'job-1' },
        data: { status: 'CANCELLED' },
      });
    });
  });
});
