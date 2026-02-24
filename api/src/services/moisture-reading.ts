import type { MoistureReading, MoistureResult } from '@prisma/client';
import type {
  IMoistureReadingRepository,
  CreateMoistureReadingInput,
  UpdateMoistureReadingInput,
  MoistureReadingSearchParams,
} from '../repositories/interfaces/moisture-reading.js';

export class MoistureReadingNotFoundError extends Error {
  constructor(id: string) {
    super(`Moisture reading not found: ${id}`);
    this.name = 'MoistureReadingNotFoundError';
  }
}

// NZ Building Code thresholds for timber moisture content
const MOISTURE_THRESHOLDS = {
  ACCEPTABLE_MAX: 18,   // <18% is acceptable
  MARGINAL_MAX: 25,     // 18-25% is marginal
  // >25% is unacceptable
} as const;

/**
 * Auto-evaluate moisture reading result based on NZ Building Code thresholds.
 *
 * - < 18%  → ACCEPTABLE
 * - 18–25% → MARGINAL
 * - > 25%  → UNACCEPTABLE
 */
export function evaluateMoistureResult(reading: number): MoistureResult {
  if (reading < MOISTURE_THRESHOLDS.ACCEPTABLE_MAX) return 'ACCEPTABLE';
  if (reading <= MOISTURE_THRESHOLDS.MARGINAL_MAX) return 'MARGINAL';
  return 'UNACCEPTABLE';
}

export class MoistureReadingService {
  constructor(private repository: IMoistureReadingRepository) {}

  /**
   * Create a moisture reading with auto-evaluation.
   * If no result is provided, it's calculated from the reading %.
   */
  async create(input: CreateMoistureReadingInput): Promise<MoistureReading> {
    const result = input.result ?? evaluateMoistureResult(input.reading);
    return this.repository.create({ ...input, result });
  }

  async findById(id: string): Promise<MoistureReading> {
    const reading = await this.repository.findById(id);
    if (!reading) {
      throw new MoistureReadingNotFoundError(id);
    }
    return reading;
  }

  async findByInspectionId(inspectionId: string): Promise<MoistureReading[]> {
    return this.repository.findByInspectionId(inspectionId);
  }

  async findAll(params?: MoistureReadingSearchParams): Promise<MoistureReading[]> {
    return this.repository.findAll(params);
  }

  /**
   * Update a moisture reading. Re-evaluates result if reading % changes
   * and no explicit result is provided.
   */
  async update(id: string, input: UpdateMoistureReadingInput): Promise<MoistureReading> {
    await this.findById(id);

    // Re-evaluate if reading changes but result is not explicitly set
    if (input.reading !== undefined && input.result === undefined) {
      input.result = evaluateMoistureResult(input.reading);
    }

    return this.repository.update(id, input);
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.repository.delete(id);
  }
}
