import { Prisma, type PrismaClient, type ReportAuditLog } from '@prisma/client';
import type {
  IReportAuditLogRepository,
  CreateReportAuditLogInput,
  ReportAuditLogSearchParams,
} from '../interfaces/report-audit-log.js';

export class PrismaReportAuditLogRepository implements IReportAuditLogRepository {
  constructor(private prisma: PrismaClient) {}

  async create(input: CreateReportAuditLogInput): Promise<ReportAuditLog> {
    return this.prisma.reportAuditLog.create({
      data: {
        reportId: input.reportId,
        action: input.action,
        userId: input.userId,
        changes: input.changes ? (input.changes as Prisma.InputJsonValue) : undefined,
      },
    });
  }

  async findById(id: string): Promise<ReportAuditLog | null> {
    return this.prisma.reportAuditLog.findUnique({
      where: { id },
    });
  }

  async findByReportId(reportId: string): Promise<ReportAuditLog[]> {
    return this.prisma.reportAuditLog.findMany({
      where: { reportId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll(params?: ReportAuditLogSearchParams): Promise<ReportAuditLog[]> {
    return this.prisma.reportAuditLog.findMany({
      where: {
        reportId: params?.reportId,
        action: params?.action,
        userId: params?.userId,
        createdAt: params?.since ? { gte: params.since } : undefined,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.reportAuditLog.delete({ where: { id } });
  }
}
