import type { ProjectPhoto } from '@prisma/client';
import type {
  IProjectPhotoRepository,
  CreateProjectPhotoInput,
  UpdateProjectPhotoInput,
} from '../repositories/prisma/project-photo.js';

export class ProjectPhotoNotFoundError extends Error {
  constructor(id: string) {
    super(`ProjectPhoto not found: ${id}`);
    this.name = 'ProjectPhotoNotFoundError';
  }
}

export class ProjectPhotoService {
  constructor(private repository: IProjectPhotoRepository) {}

  async create(input: CreateProjectPhotoInput): Promise<ProjectPhoto> {
    return this.repository.create(input);
  }

  async findById(id: string): Promise<ProjectPhoto> {
    const photo = await this.repository.findById(id);
    if (!photo) {
      throw new ProjectPhotoNotFoundError(id);
    }
    return photo;
  }

  async findByProjectId(projectId: string): Promise<ProjectPhoto[]> {
    return this.repository.findByProjectId(projectId);
  }

  async update(id: string, input: UpdateProjectPhotoInput): Promise<ProjectPhoto> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new ProjectPhotoNotFoundError(id);
    }
    return this.repository.update(id, input);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new ProjectPhotoNotFoundError(id);
    }
    await this.repository.delete(id);
  }

  async reorder(projectId: string, photoIds: string[]): Promise<void> {
    await this.repository.reorder(projectId, photoIds);
  }

  async getNextReportNumber(projectId: string): Promise<number> {
    return this.repository.getNextReportNumber(projectId);
  }
}
