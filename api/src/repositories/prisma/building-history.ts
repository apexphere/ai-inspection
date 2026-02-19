import type { PrismaClient, BuildingHistory } from '@prisma/client';
import type {
  IBuildingHistoryRepository,
  CreateBuildingHistoryInput,
  UpdateBuildingHistoryInput,
} from '../interfaces/building-history.js';

export class PrismaBuildingHistoryRepository implements IBuildingHistoryRepository {
  constructor(private prisma: PrismaClient) {}

  async create(input: CreateBuildingHistoryInput): Promise<BuildingHistory> {
    return this.prisma.buildingHistory.create({
      data: {
        propertyId: input.propertyId,
        type: input.type,
        reference: input.reference,
        year: input.year,
        status: input.status || 'UNKNOWN',
        description: input.description,
        issuer: input.issuer,
        issuedAt: input.issuedAt,
      },
    });
  }

  async findById(id: string): Promise<BuildingHistory | null> {
    return this.prisma.buildingHistory.findUnique({
      where: { id },
    });
  }

  async findByPropertyId(propertyId: string): Promise<BuildingHistory[]> {
    return this.prisma.buildingHistory.findMany({
      where: { propertyId },
      orderBy: [{ year: 'desc' }, { sortOrder: 'asc' }],
    });
  }

  async update(id: string, input: UpdateBuildingHistoryInput): Promise<BuildingHistory> {
    return this.prisma.buildingHistory.update({
      where: { id },
      data: {
        type: input.type,
        reference: input.reference,
        year: input.year,
        status: input.status,
        description: input.description,
        issuer: input.issuer,
        issuedAt: input.issuedAt,
        sortOrder: input.sortOrder,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.buildingHistory.delete({
      where: { id },
    });
  }
}
