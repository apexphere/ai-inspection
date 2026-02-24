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

  console.log(`[Worker] Starting job ${dbJobId} for inspection ${inspectionId}`);

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

    console.log(`[Worker] Completed job ${dbJobId} for inspection ${inspectionId}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[Worker] Job ${dbJobId} failed: ${message}`);

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
    console.log('[Worker] Redis connection verified');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[Worker] ⚠️  Redis unreachable — report generation jobs will not process: ${msg}`);
    // Return a no-op placeholder; don't crash the server
    return null as unknown as Worker<GenerationJobData>;
  }

  _worker = new Worker<GenerationJobData>(QUEUE_NAME, processJob, {
    connection: getRedisConnection(),
    concurrency: MAX_CONCURRENCY,
  });

  _worker.on('completed', (job) => {
    console.log(`[Worker] Job ${job.id} completed`);
  });

  _worker.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed: ${err.message}`);
  });

  _worker.on('error', (err) => {
    console.error('[Worker] Error:', err.message);
  });

  console.log(`[Worker] Started report generation worker (concurrency: ${MAX_CONCURRENCY})`);
  return _worker;
}

export async function stopReportWorker(): Promise<void> {
  if (_worker) {
    await _worker.close();
    _worker = null;
    console.log('[Worker] Report generation worker stopped');
  }
}
