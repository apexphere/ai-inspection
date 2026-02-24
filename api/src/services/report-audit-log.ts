import type { ReportAuditLog, ReportAuditAction } from '@prisma/client';
import type {
  IReportAuditLogRepository,
  CreateReportAuditLogInput,
  ReportAuditLogSearchParams,
} from '../repositories/interfaces/report-audit-log.js';

export class ReportAuditLogNotFoundError extends Error {
  constructor(id: string) {
    super(`Report audit log entry not found: ${id}`);
    this.name = 'ReportAuditLogNotFoundError';
  }
}

export class ReportAuditLogService {
  constructor(private repository: IReportAuditLogRepository) {}

  /**
   * Record a new audit log entry.
   */
  async log(input: CreateReportAuditLogInput): Promise<ReportAuditLog> {
    return this.repository.create(input);
  }

  /**
   * Convenience: log state transition.
   */
  async logStatusChange(
    reportId: string,
    from: string,
    to: string,
    userId?: string
  ): Promise<ReportAuditLog> {
    return this.repository.create({
      reportId,
      action: 'STATUS_CHANGED' as ReportAuditAction,
      userId,
      changes: { from, to },
    });
  }

  /**
   * Convenience: log content update.
   */
  async logContentUpdate(
    reportId: string,
    changes: Record<string, unknown>,
    userId?: string
  ): Promise<ReportAuditLog> {
    return this.repository.create({
      reportId,
      action: 'CONTENT_UPDATED' as ReportAuditAction,
      userId,
      changes,
    });
  }

  /**
   * Convenience: log version creation.
   */
  async logVersionCreated(
    reportId: string,
    version: number,
    userId?: string
  ): Promise<ReportAuditLog> {
    return this.repository.create({
      reportId,
      action: 'VERSION_CREATED' as ReportAuditAction,
      userId,
      changes: { version },
    });
  }

  /**
   * Get all audit log entries for a report, newest first.
   */
  async getHistory(reportId: string): Promise<ReportAuditLog[]> {
    return this.repository.findByReportId(reportId);
  }

  /**
   * Get a single audit log entry.
   */
  async findById(id: string): Promise<ReportAuditLog> {
    const entry = await this.repository.findById(id);
    if (!entry) {
      throw new ReportAuditLogNotFoundError(id);
    }
    return entry;
  }

  /**
   * Query audit logs with optional filters.
   */
  async findAll(params?: ReportAuditLogSearchParams): Promise<ReportAuditLog[]> {
    return this.repository.findAll(params);
  }

  // Audit logs are append-only — no delete method.
  // Data cleanup, if ever needed, is a DBA operation.
}
