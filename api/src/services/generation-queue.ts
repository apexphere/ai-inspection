/**
 * Report Generation Queue Service
 * Manages BullMQ job queue for async report generation.
 * When Redis is not configured, enqueue operations throw a clear error.
 */

import { Queue } from 'bullmq';
import type { PrismaClient } from '@prisma/client';
import { getRedisConnection, isRedisConfigured } from '../config/redis.js';

export const QUEUE_NAME = 'report-generation';
export const MAX_CONCURRENCY = 3;

export interface GenerationJobData {
  inspectionId: string;
  dbJobId: string;
}

export class JobNotFoundError extends Error {
  constructor(id: string) {
    super(`Generation job not found: ${id}`);
    this.name = 'JobNotFoundError';
  }
}

export class JobAlreadyActiveError extends Error {
  constructor(inspectionId: string) {
    super(`A generation job is already active for inspection: ${inspectionId}`);
    this.name = 'JobAlreadyActiveError';
  }
}

export class QueueUnavailableError extends Error {
  constructor() {
    super('Report generation queue is unavailable — REDIS_URL is not configured');
    this.name = 'QueueUnavailableError';
  }
}

let _queue: Queue<GenerationJobData> | null = null;

/**
 * Get the BullMQ queue instance. Returns null when Redis is not configured.
 */
export function getQueue(): Queue<GenerationJobData> | null {
  if (!isRedisConfigured()) {
    return null;
  }

  if (!_queue) {
    const connection = getRedisConnection();
    if (!connection) return null;

    _queue = new Queue<GenerationJobData>(QUEUE_NAME, {
      connection,
      defaultJobOptions: {
        attempts: 2,
        backoff: {
          type: 'exponential',
          delay: 5000, // 5s, then 10s
        },
        removeOnComplete: { age: 3600 }, // keep 1h
        removeOnFail: { age: 86400 },    // keep 24h
      },
    });
  }
  return _queue;
}

export class GenerationQueueService {
  constructor(
    private prisma: PrismaClient,
    private getJobQueue: () => Queue<GenerationJobData> | null = getQueue
  ) {}

  /**
   * Enqueue a report generation job for an inspection.
   * Rejects if there's already an active job for this inspection.
   * Throws QueueUnavailableError if Redis is not configured.
   */
  async enqueue(inspectionId: string): Promise<{ jobId: string; status: string }> {
    const queue = this.getJobQueue();
    if (!queue) {
      throw new QueueUnavailableError();
    }

    // Check for active jobs
    const existing = await this.prisma.generationJob.findFirst({
      where: {
        inspectionId,
        status: { in: ['PENDING', 'PROCESSING', 'RETRYING'] },
      },
    });

    if (existing) {
      throw new JobAlreadyActiveError(inspectionId);
    }

    // Create DB record first
    const dbJob = await this.prisma.generationJob.create({
      data: {
        inspectionId,
        status: 'PENDING',
        progress: 0,
      },
    });

    // Enqueue in BullMQ
    const bullJob = await queue.add(
      'generate',
      { inspectionId, dbJobId: dbJob.id },
      { jobId: dbJob.id }
    );

    // Store BullMQ job ID
    await this.prisma.generationJob.update({
      where: { id: dbJob.id },
      data: { bullJobId: bullJob.id ?? null },
    });

    return { jobId: dbJob.id, status: 'PENDING' };
  }

  /**
   * Get current status of a generation job.
   */
  async getStatus(jobId: string): Promise<{
    jobId: string;
    inspectionId: string;
    status: string;
    progress: number;
    error?: string | null;
    createdAt: Date;
    updatedAt: Date;
  }> {
    const job = await this.prisma.generationJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new JobNotFoundError(jobId);
    }

    return {
      jobId: job.id,
      inspectionId: job.inspectionId,
      status: job.status,
      progress: job.progress,
      error: job.error,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    };
  }

  /**
   * Get the latest job for a given inspection.
   */
  async getLatestByInspection(inspectionId: string): Promise<{
    jobId: string;
    inspectionId: string;
    status: string;
    progress: number;
    error?: string | null;
    createdAt: Date;
    updatedAt: Date;
  } | null> {
    const job = await this.prisma.generationJob.findFirst({
      where: { inspectionId },
      orderBy: { createdAt: 'desc' },
    });

    if (!job) return null;

    return {
      jobId: job.id,
      inspectionId: job.inspectionId,
      status: job.status,
      progress: job.progress,
      error: job.error,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    };
  }

  /**
   * Cancel a pending job.
   * Only PENDING jobs can be cancelled (processing jobs cannot be interrupted).
   */
  async cancel(jobId: string): Promise<void> {
    const job = await this.prisma.generationJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new JobNotFoundError(jobId);
    }

    if (job.status !== 'PENDING') {
      throw new Error(`Cannot cancel job in status: ${job.status}. Only PENDING jobs can be cancelled.`);
    }

    // Remove from BullMQ queue
    if (job.bullJobId) {
      const queue = this.getJobQueue();
      if (queue) {
        const bullJob = await queue.getJob(job.bullJobId);
        if (bullJob) {
          await bullJob.remove();
        }
      }
    }

    // Mark as cancelled in DB
    await this.prisma.generationJob.update({
      where: { id: jobId },
      data: { status: 'CANCELLED' },
    });
  }
}
