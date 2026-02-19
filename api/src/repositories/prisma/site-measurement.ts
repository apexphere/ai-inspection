import type { PrismaClient } from '@prisma/client';
import type {
  ISiteMeasurementRepository,
  CreateSiteMeasurementInput,
  UpdateSiteMeasurementInput,
  SiteMeasurementWithClause,
} from '../interfaces/site-measurement.js';

const clauseInclude = {
  linkedClause: {
    select: {
      id: true,
      code: true,
      title: true,
    },
  },
};

export class PrismaSiteMeasurementRepository implements ISiteMeasurementRepository {
  constructor(private prisma: PrismaClient) {}

  async create(input: CreateSiteMeasurementInput): Promise<SiteMeasurementWithClause> {
    return this.prisma.siteMeasurement.create({
      data: {
        inspectionId: input.inspectionId,
        type: input.type,
        location: input.location,
        value: input.value,
        unit: input.unit,
        linkedClauseId: input.linkedClauseId,
        notes: input.notes,
      },
      include: clauseInclude,
    });
  }

  async findById(id: string): Promise<SiteMeasurementWithClause | null> {
    return this.prisma.siteMeasurement.findUnique({
      where: { id },
      include: clauseInclude,
    });
  }

  async findByInspectionId(inspectionId: string): Promise<SiteMeasurementWithClause[]> {
    return this.prisma.siteMeasurement.findMany({
      where: { inspectionId },
      include: clauseInclude,
      orderBy: { sortOrder: 'asc' },
    });
  }

  async update(id: string, input: UpdateSiteMeasurementInput): Promise<SiteMeasurementWithClause> {
    return this.prisma.siteMeasurement.update({
      where: { id },
      data: {
        type: input.type,
        location: input.location,
        value: input.value,
        unit: input.unit,
        result: input.result,
        linkedClauseId: input.linkedClauseId,
        notes: input.notes,
        sortOrder: input.sortOrder,
      },
      include: clauseInclude,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.siteMeasurement.delete({
      where: { id },
    });
  }
}
