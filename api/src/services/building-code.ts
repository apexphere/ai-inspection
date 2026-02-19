import type { BuildingCodeClause, ClauseCategory } from '@prisma/client';
import type {
  IBuildingCodeClauseRepository,
  CreateBuildingCodeClauseInput,
  UpdateBuildingCodeClauseInput,
  BuildingCodeClauseSearchParams,
} from '../repositories/interfaces/building-code.js';

export class BuildingCodeClauseNotFoundError extends Error {
  constructor(idOrCode: string) {
    super(`Building code clause not found: ${idOrCode}`);
    this.name = 'BuildingCodeClauseNotFoundError';
  }
}

export class BuildingCodeClauseService {
  constructor(private repository: IBuildingCodeClauseRepository) {}

  async create(input: CreateBuildingCodeClauseInput): Promise<BuildingCodeClause> {
    return this.repository.create(input);
  }

  async findAll(params?: BuildingCodeClauseSearchParams): Promise<BuildingCodeClause[]> {
    return this.repository.findAll(params);
  }

  async findById(id: string): Promise<BuildingCodeClause> {
    const clause = await this.repository.findById(id);
    if (!clause) {
      throw new BuildingCodeClauseNotFoundError(id);
    }
    return clause;
  }

  async findByCode(code: string): Promise<BuildingCodeClause> {
    const clause = await this.repository.findByCode(code);
    if (!clause) {
      throw new BuildingCodeClauseNotFoundError(code);
    }
    return clause;
  }

  async findByCategory(category: ClauseCategory): Promise<BuildingCodeClause[]> {
    return this.repository.findByCategory(category);
  }

  async findTopLevel(): Promise<BuildingCodeClause[]> {
    return this.repository.findTopLevel();
  }

  async findChildren(parentId: string): Promise<BuildingCodeClause[]> {
    return this.repository.findChildren(parentId);
  }

  async update(id: string, input: UpdateBuildingCodeClauseInput): Promise<BuildingCodeClause> {
    await this.findById(id);
    return this.repository.update(id, input);
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.repository.delete(id);
  }

  async bulkCreate(clauses: CreateBuildingCodeClauseInput[]): Promise<BuildingCodeClause[]> {
    return this.repository.bulkCreate(clauses);
  }

  async search(keyword: string): Promise<BuildingCodeClause[]> {
    return this.repository.findAll({ keyword });
  }

  async getHierarchy(): Promise<Record<ClauseCategory, BuildingCodeClause[]>> {
    const clauses = await this.findTopLevel();
    const grouped: Record<string, BuildingCodeClause[]> = {};
    
    for (const clause of clauses) {
      if (!grouped[clause.category]) {
        grouped[clause.category] = [];
      }
      grouped[clause.category].push(clause);
    }
    
    return grouped as Record<ClauseCategory, BuildingCodeClause[]>;
  }
}
