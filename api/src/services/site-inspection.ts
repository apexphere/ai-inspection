import type { SiteInspection } from '@prisma/client';
import type {
  ISiteInspectionRepository,
  CreateSiteInspectionInput,
  UpdateSiteInspectionInput,
  SiteInspectionSearchParams,
} from '../repositories/interfaces/site-inspection.js';

export class SiteInspectionNotFoundError extends Error {
  constructor(id: string) {
    super(`Site inspection not found: ${id}`);
    this.name = 'SiteInspectionNotFoundError';
  }
}

export class SiteInspectionDeletedError extends Error {
  constructor(id: string) {
    super(`Site inspection has been deleted: ${id}`);
    this.name = 'SiteInspectionDeletedError';
  }
}

export class SiteInspectionService {
  constructor(private repository: ISiteInspectionRepository) {}

  async create(input: CreateSiteInspectionInput): Promise<SiteInspection> {
    return this.repository.create(input);
  }

  async findAll(params?: SiteInspectionSearchParams): Promise<SiteInspection[]> {
    return this.repository.findAll(params);
  }

  async findById(id: string): Promise<SiteInspection> {
    const inspection = await this.repository.findById(id);
    if (!inspection) {
      throw new SiteInspectionNotFoundError(id);
    }
    return inspection;
  }

  async findByProjectId(projectId: string): Promise<SiteInspection[]> {
    return this.repository.findByProjectId(projectId);
  }

  async update(id: string, input: UpdateSiteInspectionInput): Promise<SiteInspection> {
    await this.findById(id);
    return this.repository.update(id, input);
  }

  async softDelete(id: string): Promise<SiteInspection> {
    await this.findById(id);
    return this.repository.softDelete(id);
  }

  async restore(id: string): Promise<SiteInspection> {
    // For restore, we need to find including deleted
    const inspection = await this.repository.findById(id, true);
    if (!inspection) {
      throw new SiteInspectionNotFoundError(id);
    }
    if (!inspection.deletedAt) {
      throw new Error(`Site inspection ${id} is not deleted`);
    }
    return this.repository.restore(id);
  }

  async complete(id: string): Promise<SiteInspection> {
    return this.update(id, { status: 'COMPLETED' });
  }

  async navigate(id: string, section: string, clauseId?: string): Promise<SiteInspection> {
    return this.update(id, {
      currentSection: section,
      currentClauseId: clauseId,
      status: 'IN_PROGRESS',
    });
  }
}
