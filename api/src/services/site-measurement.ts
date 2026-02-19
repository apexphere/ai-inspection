import type { MeasurementType, MeasurementUnit, MeasurementResult } from '@prisma/client';
import type {
  ISiteMeasurementRepository,
  CreateSiteMeasurementInput,
  UpdateSiteMeasurementInput,
  SiteMeasurementWithClause,
} from '../repositories/interfaces/site-measurement.js';

export class SiteMeasurementNotFoundError extends Error {
  constructor(id: string) {
    super(`Site measurement not found: ${id}`);
    this.name = 'SiteMeasurementNotFoundError';
  }
}

// Acceptable ranges for auto-evaluation
const ACCEPTABLE_RANGES: Partial<Record<MeasurementType, { max?: number; min?: number }>> = {
  MOISTURE_CONTENT: { max: 18 },      // < 18% is acceptable
  SLOPE_FALL: { min: 10 },            // ≥ 1:100 (10mm/m) is acceptable
};

export class SiteMeasurementService {
  constructor(private repository: ISiteMeasurementRepository) {}

  async create(input: CreateSiteMeasurementInput): Promise<SiteMeasurementWithClause> {
    const measurement = await this.repository.create(input);
    
    // Auto-evaluate if we have acceptable ranges
    const result = this.evaluate(input.type, input.value);
    if (result !== 'PENDING') {
      return this.repository.update(measurement.id, { result });
    }
    
    return measurement;
  }

  async findById(id: string): Promise<SiteMeasurementWithClause> {
    const measurement = await this.repository.findById(id);
    if (!measurement) {
      throw new SiteMeasurementNotFoundError(id);
    }
    return measurement;
  }

  async findByInspectionId(inspectionId: string): Promise<SiteMeasurementWithClause[]> {
    return this.repository.findByInspectionId(inspectionId);
  }

  async update(id: string, input: UpdateSiteMeasurementInput): Promise<SiteMeasurementWithClause> {
    const existing = await this.findById(id);
    
    // Re-evaluate if value or type changed
    if (input.value !== undefined || input.type !== undefined) {
      const type = input.type || existing.type;
      const value = input.value !== undefined ? input.value : existing.value;
      const result = this.evaluate(type, value);
      if (result !== 'PENDING') {
        input.result = result;
      }
    }
    
    return this.repository.update(id, input);
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.repository.delete(id);
  }

  /**
   * Evaluate measurement against acceptable ranges
   */
  private evaluate(type: MeasurementType, value: number): MeasurementResult {
    const range = ACCEPTABLE_RANGES[type];
    if (!range) {
      return 'PENDING'; // No auto-evaluation for this type
    }

    if (range.max !== undefined && value > range.max) {
      return 'FAIL';
    }
    if (range.min !== undefined && value < range.min) {
      return 'FAIL';
    }
    
    return 'PASS';
  }

  /**
   * Get acceptable range info for a measurement type
   */
  getAcceptableRange(type: MeasurementType): { max?: number; min?: number; description: string } | null {
    const range = ACCEPTABLE_RANGES[type];
    if (!range) return null;

    let description = '';
    if (range.max !== undefined) {
      description = `< ${range.max}`;
    }
    if (range.min !== undefined) {
      description = `≥ ${range.min}`;
    }

    return { ...range, description };
  }
}
