import { PrismaClient, type ProjectPhoto, type PhotoSource } from '@prisma/client';

export interface CreateProjectPhotoInput {
  projectId: string;
  inspectionId?: string;
  filePath: string;
  thumbnailPath?: string;
  mimeType?: string;
  fileSize?: number;
  caption: string;
  source?: PhotoSource;
  takenAt?: Date;
  location?: Record<string, unknown>;
  linkedClauses?: string[];
}

export interface UpdateProjectPhotoInput {
  caption?: string;
  source?: PhotoSource;
  linkedClauses?: string[];
  sortOrder?: number;
}

export interface IProjectPhotoRepository {
  create(input: CreateProjectPhotoInput): Promise<ProjectPhoto>;
  findById(id: string): Promise<ProjectPhoto | null>;
  findByProjectId(projectId: string): Promise<ProjectPhoto[]>;
  update(id: string, input: UpdateProjectPhotoInput): Promise<ProjectPhoto>;
  delete(id: string): Promise<void>;
  reorder(projectId: string, photoIds: string[]): Promise<void>;
  getNextReportNumber(projectId: string): Promise<number>;
  renumber(projectId: string): Promise<void>;
}

export class PrismaProjectPhotoRepository implements IProjectPhotoRepository {
  constructor(private prisma: PrismaClient) {}

  async create(input: CreateProjectPhotoInput): Promise<ProjectPhoto> {
    const reportNumber = await this.getNextReportNumber(input.projectId);
    
    return this.prisma.projectPhoto.create({
      data: {
        ...input,
        reportNumber,
        sortOrder: reportNumber,
      },
    });
  }

  async findById(id: string): Promise<ProjectPhoto | null> {
    return this.prisma.projectPhoto.findUnique({
      where: { id },
    });
  }

  async findByProjectId(projectId: string): Promise<ProjectPhoto[]> {
    return this.prisma.projectPhoto.findMany({
      where: { projectId },
      orderBy: [
        { sortOrder: 'asc' },
        { reportNumber: 'asc' },
      ],
    });
  }

  async update(id: string, input: UpdateProjectPhotoInput): Promise<ProjectPhoto> {
    return this.prisma.projectPhoto.update({
      where: { id },
      data: input,
    });
  }

  async delete(id: string): Promise<void> {
    const photo = await this.prisma.projectPhoto.findUnique({
      where: { id },
      select: { projectId: true },
    });
    
    await this.prisma.projectPhoto.delete({
      where: { id },
    });
    
    // Renumber remaining photos
    if (photo) {
      await this.renumber(photo.projectId);
    }
  }

  async reorder(projectId: string, photoIds: string[]): Promise<void> {
    await this.prisma.$transaction(
      photoIds.map((id, index) =>
        this.prisma.projectPhoto.updateMany({
          where: { id, projectId }, // Verify ownership
          data: { 
            sortOrder: index,
            reportNumber: index + 1,
          },
        })
      )
    );
  }

  async getNextReportNumber(projectId: string): Promise<number> {
    const maxPhoto = await this.prisma.projectPhoto.findFirst({
      where: { projectId },
      orderBy: { reportNumber: 'desc' },
      select: { reportNumber: true },
    });
    
    return (maxPhoto?.reportNumber ?? 0) + 1;
  }

  async renumber(projectId: string): Promise<void> {
    const photos = await this.prisma.projectPhoto.findMany({
      where: { projectId },
      orderBy: { sortOrder: 'asc' },
      select: { id: true },
    });
    
    await this.prisma.$transaction(
      photos.map((photo, index) =>
        this.prisma.projectPhoto.update({
          where: { id: photo.id },
          data: { 
            reportNumber: index + 1,
            sortOrder: index,
          },
        })
      )
    );
  }
}
