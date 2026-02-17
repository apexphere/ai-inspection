import type { Finding } from '@prisma/client';
import type {
  IInspectionRepository,
  CreateFindingInput,
  UpdateFindingInput,
} from '../repositories/interfaces/inspection.js';
import { InspectionNotFoundError } from './inspection.js';

export { InspectionNotFoundError };

export class FindingNotFoundError extends Error {
  constructor(id: string) {
    super(`Finding not found: ${id}`);
    this.name = 'FindingNotFoundError';
  }
}

export class FindingService {
  constructor(private repository: IInspectionRepository) {}

  async create(input: CreateFindingInput): Promise<Finding> {
    // Verify inspection exists
    const inspection = await this.repository.findById(input.inspectionId);
    if (!inspection) {
      throw new InspectionNotFoundError(input.inspectionId);
    }
    return this.repository.createFinding(input);
  }

  async findById(id: string): Promise<Finding> {
    const finding = await this.repository.findFindingById(id);
    if (!finding) {
      throw new FindingNotFoundError(id);
    }
    return finding;
  }

  async findByInspection(inspectionId: string): Promise<Finding[]> {
    // Verify inspection exists
    const inspection = await this.repository.findById(inspectionId);
    if (!inspection) {
      throw new InspectionNotFoundError(inspectionId);
    }
    return this.repository.findFindingsByInspection(inspectionId);
  }

  async update(id: string, input: UpdateFindingInput): Promise<Finding> {
    // Verify exists
    await this.findById(id);
    return this.repository.updateFinding(id, input);
  }

  async delete(id: string): Promise<void> {
    // Verify exists
    await this.findById(id);
    await this.repository.deleteFinding(id);
  }
}
