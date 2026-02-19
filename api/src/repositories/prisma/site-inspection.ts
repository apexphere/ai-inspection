import { PrismaClient, type SiteInspection } from '@prisma/client';
import type {
  ISiteInspectionRepository,
  CreateSiteInspectionInput,
  UpdateSiteInspectionInput,
  SiteInspectionSearchParams,
} from '../interfaces/site-inspection.js';

export class PrismaSiteInspectionRepository implements ISiteInspectionRepository {
  constructor(private prisma: PrismaClient) {}

  async create(input: CreateSiteInspectionInput): Promise<SiteInspection> {
    return this.prisma.siteInspection.create({
      data: input,
      include: {
        project: {
          include: {
            property: true,
            client: true,
          },
        },
      },
    });
  }

  async findById(id: string, includeDeleted = false): Promise<SiteInspection | null> {
    return this.prisma.siteInspection.findFirst({
      where: {
        id,
        ...(includeDeleted ? {} : { deletedAt: null }),
      },
      include: {
        project: {
          include: {
            property: true,
            client: true,
          },
        },
      },
    });
  }

  async findByProjectId(projectId: string, includeDeleted = false): Promise<SiteInspection[]> {
    return this.prisma.siteInspection.findMany({
      where: {
        projectId,
        ...(includeDeleted ? {} : { deletedAt: null }),
      },
      include: {
        project: {
          include: {
            property: true,
            client: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });
  }

  async findAll(params?: SiteInspectionSearchParams): Promise<SiteInspection[]> {
    const where: Record<string, unknown> = {};

    if (!params?.includeDeleted) {
      where.deletedAt = null;
    }
    if (params?.projectId) {
      where.projectId = params.projectId;
    }
    if (params?.type) {
      where.type = params.type;
    }
    if (params?.stage) {
      where.stage = params.stage;
    }
    if (params?.status) {
      where.status = params.status;
    }

    return this.prisma.siteInspection.findMany({
      where,
      include: {
        project: {
          include: {
            property: true,
            client: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, input: UpdateSiteInspectionInput): Promise<SiteInspection> {
    return this.prisma.siteInspection.update({
      where: { id },
      data: input,
      include: {
        project: {
          include: {
            property: true,
            client: true,
          },
        },
      },
    });
  }

  async softDelete(id: string): Promise<SiteInspection> {
    return this.prisma.siteInspection.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async restore(id: string): Promise<SiteInspection> {
    return this.prisma.siteInspection.update({
      where: { id },
      data: { deletedAt: null },
    });
  }

  async hardDelete(id: string): Promise<void> {
    await this.prisma.siteInspection.delete({
      where: { id },
    });
  }
}
