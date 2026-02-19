import { PrismaClient, type BuildingCodeClause, type ClauseCategory } from '@prisma/client';
import type {
  IBuildingCodeClauseRepository,
  CreateBuildingCodeClauseInput,
  UpdateBuildingCodeClauseInput,
  BuildingCodeClauseSearchParams,
} from '../interfaces/building-code.js';

export class PrismaBuildingCodeClauseRepository implements IBuildingCodeClauseRepository {
  constructor(private prisma: PrismaClient) {}

  async create(input: CreateBuildingCodeClauseInput): Promise<BuildingCodeClause> {
    return this.prisma.buildingCodeClause.create({
      data: input,
      include: {
        parent: true,
        children: true,
      },
    });
  }

  async findById(id: string): Promise<BuildingCodeClause | null> {
    return this.prisma.buildingCodeClause.findUnique({
      where: { id },
      include: {
        parent: true,
        children: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  async findByCode(code: string): Promise<BuildingCodeClause | null> {
    return this.prisma.buildingCodeClause.findUnique({
      where: { code },
      include: {
        parent: true,
        children: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  async findAll(params?: BuildingCodeClauseSearchParams): Promise<BuildingCodeClause[]> {
    const where: Record<string, unknown> = {};

    if (params?.category) {
      where.category = params.category;
    }
    if (params?.parentId !== undefined) {
      where.parentId = params.parentId;
    }
    if (params?.keyword) {
      where.OR = [
        { code: { contains: params.keyword, mode: 'insensitive' } },
        { title: { contains: params.keyword, mode: 'insensitive' } },
        { performanceText: { contains: params.keyword, mode: 'insensitive' } },
      ];
    }

    return this.prisma.buildingCodeClause.findMany({
      where,
      include: {
        parent: true,
        children: {
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: [
        { category: 'asc' },
        { sortOrder: 'asc' },
      ],
    });
  }

  async findByCategory(category: ClauseCategory): Promise<BuildingCodeClause[]> {
    return this.findAll({ category });
  }

  async findTopLevel(): Promise<BuildingCodeClause[]> {
    return this.findAll({ parentId: null });
  }

  async findChildren(parentId: string): Promise<BuildingCodeClause[]> {
    return this.findAll({ parentId });
  }

  async update(id: string, input: UpdateBuildingCodeClauseInput): Promise<BuildingCodeClause> {
    return this.prisma.buildingCodeClause.update({
      where: { id },
      data: input,
      include: {
        parent: true,
        children: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.buildingCodeClause.delete({
      where: { id },
    });
  }

  async bulkCreate(clauses: CreateBuildingCodeClauseInput[]): Promise<BuildingCodeClause[]> {
    return this.prisma.$transaction(
      clauses.map((clause) =>
        this.prisma.buildingCodeClause.create({
          data: clause,
          include: {
            parent: true,
            children: true,
          },
        })
      )
    );
  }
}
