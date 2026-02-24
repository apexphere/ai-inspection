/**
 * Prisma Report Repository — Issue #192
 */

import { PrismaClient, type Report } from '@prisma/client';
import type {
  IReportManagementRepository,
  CreateManagedReportInput,
  UpdateManagedReportInput,
  ReportSearchParams,
} from '../interfaces/report.js';

export class PrismaReportManagementRepository implements IReportManagementRepository {
  constructor(private prisma: PrismaClient) {}

  async create(input: CreateManagedReportInput): Promise<Report> {
    return this.prisma.report.create({
      data: input,
      include: {
        siteInspection: {
          include: {
            project: {
              include: {
                property: true,
                client: true,
              },
            },
          },
        },
      },
    });
  }

  async findById(id: string): Promise<Report | null> {
    return this.prisma.report.findUnique({
      where: { id },
      include: {
        siteInspection: {
          include: {
            project: {
              include: {
                property: true,
                client: true,
              },
            },
          },
        },
      },
    });
  }

  async findAll(params?: ReportSearchParams): Promise<Report[]> {
    const where: Record<string, unknown> = {};

    if (params?.siteInspectionId) where.siteInspectionId = params.siteInspectionId;
    if (params?.type) where.type = params.type;
    if (params?.status) where.status = params.status;
    if (params?.preparedById) where.preparedById = params.preparedById;

    return this.prisma.report.findMany({
      where,
      include: {
        siteInspection: {
          include: {
            project: {
              include: {
                property: true,
                client: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findBySiteInspectionId(siteInspectionId: string): Promise<Report[]> {
    return this.prisma.report.findMany({
      where: { siteInspectionId },
      include: {
        siteInspection: {
          include: {
            project: {
              include: {
                property: true,
                client: true,
              },
            },
          },
        },
      },
      orderBy: { version: 'desc' },
    });
  }

  async update(id: string, input: UpdateManagedReportInput): Promise<Report> {
    return this.prisma.report.update({
      where: { id },
      data: input,
      include: {
        siteInspection: {
          include: {
            project: {
              include: {
                property: true,
                client: true,
              },
            },
          },
        },
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.report.delete({
      where: { id },
    });
  }
}
