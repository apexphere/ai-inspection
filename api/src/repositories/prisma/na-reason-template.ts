import { PrismaClient, type NAReasonTemplate } from '@prisma/client';
import type { INAReasonTemplateRepository } from '../interfaces/na-reason-template.js';

export class PrismaNAReasonTemplateRepository implements INAReasonTemplateRepository {
  constructor(private prisma: PrismaClient) {}

  async findAll(): Promise<NAReasonTemplate[]> {
    return this.prisma.nAReasonTemplate.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findById(id: string): Promise<NAReasonTemplate | null> {
    return this.prisma.nAReasonTemplate.findUnique({
      where: { id },
    });
  }
}
