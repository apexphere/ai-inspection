import type { BuildingHistory } from '@prisma/client';
import type {
  IBuildingHistoryRepository,
  CreateBuildingHistoryInput,
  UpdateBuildingHistoryInput,
} from '../repositories/interfaces/building-history.js';

export class BuildingHistoryNotFoundError extends Error {
  constructor(id: string) {
    super(`Building history not found: ${id}`);
    this.name = 'BuildingHistoryNotFoundError';
  }
}

export class BuildingHistoryService {
  constructor(private repository: IBuildingHistoryRepository) {}

  async create(input: CreateBuildingHistoryInput): Promise<BuildingHistory> {
    return this.repository.create(input);
  }

  async findById(id: string): Promise<BuildingHistory> {
    const history = await this.repository.findById(id);
    if (!history) {
      throw new BuildingHistoryNotFoundError(id);
    }
    return history;
  }

  async findByPropertyId(propertyId: string): Promise<BuildingHistory[]> {
    return this.repository.findByPropertyId(propertyId);
  }

  async update(id: string, input: UpdateBuildingHistoryInput): Promise<BuildingHistory> {
    // Verify exists
    await this.findById(id);
    return this.repository.update(id, input);
  }

  async delete(id: string): Promise<void> {
    // Verify exists
    await this.findById(id);
    await this.repository.delete(id);
  }
}
