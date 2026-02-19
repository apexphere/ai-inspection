import type { PrismaClient, InspectionPhoto } from '@prisma/client';
import type {
  IInspectionPhotoRepository,
  CreateInspectionPhotoInput,
  UpdateInspectionPhotoInput,
} from '../interfaces/inspection-photo.js';

export class PrismaInspectionPhotoRepository implements IInspectionPhotoRepository {
  constructor(private prisma: PrismaClient) {}

  async create(input: CreateInspectionPhotoInput): Promise<InspectionPhoto> {
    const reportNumber = await this.getNextReportNumber(input.projectId);
    
    return this.prisma.inspectionPhoto.create({
      data: {
        projectId: input.projectId,
        inspectionId: input.inspectionId,
        reportNumber,
        filePath: input.filePath,
        thumbnailPath: input.thumbnailPath,
        filename: input.filename,
        mimeType: input.mimeType || 'image/jpeg',
        caption: input.caption,
        source: input.source || 'SITE',
        takenAt: input.takenAt,
        location: input.location,
        linkedClauses: input.linkedClauses || [],
        linkedItemId: input.linkedItemId,
        linkedItemType: input.linkedItemType,
        sortOrder: reportNumber, // Default sort by report number
      },
    });
  }

  async findById(id: string): Promise<InspectionPhoto | null> {
    return this.prisma.inspectionPhoto.findUnique({
      where: { id },
    });
  }

  async findByProjectId(projectId: string): Promise<InspectionPhoto[]> {
    return this.prisma.inspectionPhoto.findMany({
      where: { projectId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findByInspectionId(inspectionId: string): Promise<InspectionPhoto[]> {
    return this.prisma.inspectionPhoto.findMany({
      where: { inspectionId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async update(id: string, input: UpdateInspectionPhotoInput): Promise<InspectionPhoto> {
    return this.prisma.inspectionPhoto.update({
      where: { id },
      data: {
        caption: input.caption,
        source: input.source,
        linkedClauses: input.linkedClauses,
        linkedItemId: input.linkedItemId,
        linkedItemType: input.linkedItemType,
        sortOrder: input.sortOrder,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.inspectionPhoto.delete({
      where: { id },
    });
  }

  async getNextReportNumber(projectId: string): Promise<number> {
    const maxPhoto = await this.prisma.inspectionPhoto.findFirst({
      where: { projectId },
      orderBy: { reportNumber: 'desc' },
      select: { reportNumber: true },
    });
    return (maxPhoto?.reportNumber || 0) + 1;
  }

  async reorder(projectId: string, photoIds: string[]): Promise<void> {
    await this.prisma.$transaction(
      photoIds.map((id, index) =>
        this.prisma.inspectionPhoto.update({
          where: { id },
          data: { sortOrder: index },
        })
      )
    );
  }
}
