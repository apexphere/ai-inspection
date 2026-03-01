import { logger } from '../lib/logger.js';
/**
 * Report Generation Worker
 * Processes BullMQ jobs for async report generation.
 * Max concurrency: 3 concurrent generation jobs.
 */

import { Worker, type Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { getRedisConnection, pingRedis } from '../config/redis.js';
import { PrismaInspectionRepository } from '../repositories/prisma/inspection.js';
import { ReportService } from '../services/report.js';
import { QUEUE_NAME, MAX_CONCURRENCY, type GenerationJobData } from '../services/generation-queue.js';

const prisma = new PrismaClient();
const repository = new PrismaInspectionRepository(prisma);
const reportService = new ReportService(repository);

let _worker: Worker<GenerationJobData> | null = null;

async function processJob(job: Job<GenerationJobData>): Promise<void> {
  const { inspectionId, dbJobId } = job.data;

  logger.info({ dbJobId, inspectionId }, 'Starting report generation job');

  // Mark as PROCESSING
  await prisma.generationJob.update({
    where: { id: dbJobId },
    data: { status: 'PROCESSING', progress: 0 },
  });
  await job.updateProgress(0);

  try {
    // Progress: 10% — starting generation
    await prisma.generationJob.update({
      where: { id: dbJobId },
      data: { progress: 10 },
    });
    await job.updateProgress(10);

    // Generate the report
    await reportService.generate(inspectionId);

    // Progress: 90% — saving
    await prisma.generationJob.update({
      where: { id: dbJobId },
      data: { progress: 90 },
    });
    await job.updateProgress(90);

    // Mark as COMPLETED
    await prisma.generationJob.update({
      where: { id: dbJobId },
      data: { status: 'COMPLETED', progress: 100 },
    });
    await job.updateProgress(100);

    logger.info({ dbJobId, inspectionId }, 'Report generation job completed');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error({ dbJobId, error: message }, 'Report generation job failed');

    // Mark status in DB: RETRYING if more attempts remain, FAILED otherwise
    const attemptsMade = job.attemptsMade ?? 0;
    const maxAttempts = job.opts.attempts ?? 1;
    const willRetry = attemptsMade < maxAttempts - 1;

    await prisma.generationJob.update({
      where: { id: dbJobId },
      data: willRetry
        ? { status: 'RETRYING', error: message }
        : { status: 'FAILED', error: message },
    });

    throw error; // Re-throw so BullMQ handles retry logic
  }
}

export async function startReportWorker(): Promise<Worker<GenerationJobData>> {
  if (_worker) {
    return _worker;
  }

  // Verify Redis is reachable before starting the worker
  try {
    await pingRedis();
    logger.info('Worker Redis connection verified');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.warn({ error: msg }, 'Redis unreachable — report generation jobs will not process');
    // Return a no-op placeholder; don't crash the server
    return null as unknown as Worker<GenerationJobData>;
  }

  _worker = new Worker<GenerationJobData>(QUEUE_NAME, processJob, {
    connection: getRedisConnection() as never,
    concurrency: MAX_CONCURRENCY,
  });

  _worker.on('completed', (job) => {
    logger.info({ jobId: job.id }, 'Worker job completed');
  });

  _worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, error: err.message }, 'Worker job failed');
  });

  _worker.on('error', (err) => {
    logger.error({ err }, 'Worker error');
  });

  logger.info({ concurrency: MAX_CONCURRENCY }, 'Report generation worker started');
  return _worker;
}

export async function stopReportWorker(): Promise<void> {
  if (_worker) {
    await _worker.close();
    _worker = null;
    logger.info('Report generation worker stopped');
  }
}
