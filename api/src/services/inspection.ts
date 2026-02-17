import type { Inspection } from '@prisma/client';
import type {
  IInspectionRepository,
  CreateInspectionInput,
  UpdateInspectionInput,
} from '../repositories/interfaces/inspection.js';

export class InspectionNotFoundError extends Error {
  constructor(id: string) {
    super(`Inspection not found: ${id}`);
    this.name = 'InspectionNotFoundError';
  }
}

export class InspectionService {
  constructor(private repository: IInspectionRepository) {}

  async create(input: CreateInspectionInput): Promise<Inspection> {
    return this.repository.create(input);
  }

  async findAll(): Promise<Inspection[]> {
    return this.repository.findAll();
  }

  async findById(id: string): Promise<Inspection> {
    const inspection = await this.repository.findById(id);
    if (!inspection) {
      throw new InspectionNotFoundError(id);
    }
    return inspection;
  }

  async update(id: string, input: UpdateInspectionInput): Promise<Inspection> {
    // Verify exists first
    await this.findById(id);
    return this.repository.update(id, input);
  }

  async delete(id: string): Promise<void> {
    // Verify exists first
    await this.findById(id);
    await this.repository.delete(id);
  }

  async complete(id: string): Promise<Inspection> {
    return this.update(id, {
      status: 'COMPLETED',
      completedAt: new Date(),
    });
  }

  async navigate(id: string, section: string): Promise<Inspection> {
    return this.update(id, {
      currentSection: section,
      status: 'IN_PROGRESS',
    });
  }
}
