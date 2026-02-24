import type { PrismaClient, MoistureReading } from '@prisma/client';
import type {
  IMoistureReadingRepository,
  CreateMoistureReadingInput,
  UpdateMoistureReadingInput,
  MoistureReadingSearchParams,
} from '../interfaces/moisture-reading.js';

export class PrismaMoistureReadingRepository implements IMoistureReadingRepository {
  constructor(private prisma: PrismaClient) {}

  async create(input: CreateMoistureReadingInput): Promise<MoistureReading> {
    return this.prisma.moistureReading.create({
      data: {
        inspectionId: input.inspectionId,
        location: input.location,
        substrate: input.substrate,
        reading: input.reading,
        depth: input.depth,
        result: input.result ?? 'PENDING',
        defectId: input.defectId,
        linkedClauseId: input.linkedClauseId,
        notes: input.notes,
        takenAt: input.takenAt,
        sortOrder: input.sortOrder ?? 0,
      },
    });
  }

  async findById(id: string): Promise<MoistureReading | null> {
    return this.prisma.moistureReading.findUnique({ where: { id } });
  }

  async findByInspectionId(inspectionId: string): Promise<MoistureReading[]> {
    return this.prisma.moistureReading.findMany({
      where: { inspectionId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async findAll(params?: MoistureReadingSearchParams): Promise<MoistureReading[]> {
    return this.prisma.moistureReading.findMany({
      where: {
        inspectionId: params?.inspectionId,
        result: params?.result,
        defectId: params?.defectId,
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async update(id: string, input: UpdateMoistureReadingInput): Promise<MoistureReading> {
    return this.prisma.moistureReading.update({
      where: { id },
      data: {
        location: input.location,
        substrate: input.substrate,
        reading: input.reading,
        depth: input.depth,
        result: input.result,
        defectId: input.defectId,
        linkedClauseId: input.linkedClauseId,
        notes: input.notes,
        takenAt: input.takenAt,
        sortOrder: input.sortOrder,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.moistureReading.delete({ where: { id } });
  }
}
