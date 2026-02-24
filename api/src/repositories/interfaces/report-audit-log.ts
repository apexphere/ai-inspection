import type { ReportAuditLog, ReportAuditAction } from '@prisma/client';

export interface CreateReportAuditLogInput {
  reportId: string;
  action: ReportAuditAction;
  userId?: string;
  changes?: Record<string, unknown>;
}

export interface ReportAuditLogSearchParams {
  reportId?: string;
  action?: ReportAuditAction;
  userId?: string;
  since?: Date;
}

export interface IReportAuditLogRepository {
  create(input: CreateReportAuditLogInput): Promise<ReportAuditLog>;
  findById(id: string): Promise<ReportAuditLog | null>;
  findByReportId(reportId: string): Promise<ReportAuditLog[]>;
  findAll(params?: ReportAuditLogSearchParams): Promise<ReportAuditLog[]>;
  // Audit logs are append-only — no delete
}
