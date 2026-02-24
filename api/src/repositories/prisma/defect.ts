/**
 * Prisma Defect Repository — Issue #218
 */

import type { PrismaClient, Defect } from '@prisma/client';
import type { IDefectRepository, CreateDefectData, UpdateDefectData } from '../interfaces/defect.js';

export class PrismaDefectRepository implements IDefectRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreateDefectData): Promise<Defect> {
    return this.prisma.defect.create({
      data: {
        inspectionId: data.inspectionId,
        defectNumber: data.defectNumber,
        location: data.location,
        element: data.element as any,
        description: data.description,
        cause: data.cause,
        remedialAction: data.remedialAction,
        priority: (data.priority as any) || 'MEDIUM',
        linkedClauseId: data.linkedClauseId,
        photoIds: data.photoIds || [],
        sortOrder: data.sortOrder || 0,
      },
    });
  }

  async findById(id: string): Promise<Defect | null> {
    return this.prisma.defect.findUnique({
      where: { id },
      include: { linkedClause: true },
    });
  }

  async findByInspectionId(inspectionId: string): Promise<Defect[]> {
    return this.prisma.defect.findMany({
      where: { inspectionId },
      include: { linkedClause: true },
      orderBy: [{ sortOrder: 'asc' }, { defectNumber: 'asc' }],
    });
  }

  async update(id: string, data: UpdateDefectData): Promise<Defect> {
    return this.prisma.defect.update({
      where: { id },
      data: {
        ...(data.location !== undefined && { location: data.location }),
        ...(data.element !== undefined && { element: data.element as any }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.cause !== undefined && { cause: data.cause }),
        ...(data.remedialAction !== undefined && { remedialAction: data.remedialAction }),
        ...(data.priority !== undefined && { priority: data.priority as any }),
        ...(data.linkedClauseId !== undefined && { linkedClauseId: data.linkedClauseId }),
        ...(data.photoIds !== undefined && { photoIds: data.photoIds }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
      },
      include: { linkedClause: true },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.defect.delete({ where: { id } });
  }

  async countByInspectionId(inspectionId: string): Promise<number> {
    return this.prisma.defect.count({ where: { inspectionId } });
  }
}
