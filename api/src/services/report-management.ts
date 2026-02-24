/**
 * Report Management Service — Issue #192
 * 
 * Manages report lifecycle: creation, status transitions, and review workflow.
 * This service handles the new Report entity with status tracking.
 * The legacy ReportService in report.ts handles PDF generation for the old system.
 */

import type {
  IReportManagementRepository,
  CreateManagedReportInput,
  UpdateManagedReportInput,
  ReportSearchParams,
} from '../repositories/interfaces/report.js';
import type { Report, ReportStatus } from '@prisma/client';

export class ReportNotFoundError extends Error {
  constructor(id: string) {
    super(`Report not found: ${id}`);
    this.name = 'ReportNotFoundError';
  }
}

export class InvalidStatusTransitionError extends Error {
  constructor(from: ReportStatus, to: ReportStatus) {
    super(`Invalid status transition: ${from} → ${to}`);
    this.name = 'InvalidStatusTransitionError';
  }
}

/**
 * Valid status transitions for report workflow.
 * DRAFT → REVIEW → APPROVED → GENERATED → SUBMITTED
 * REVIEW → DRAFT (request changes)
 */
const VALID_TRANSITIONS: Record<ReportStatus, ReportStatus[]> = {
  DRAFT: ['REVIEW'],
  REVIEW: ['DRAFT', 'APPROVED'],
  APPROVED: ['GENERATED'],
  GENERATED: ['SUBMITTED'],
  SUBMITTED: [],
};

export class ReportManagementService {
  constructor(private repository: IReportManagementRepository) {}

  async create(input: CreateManagedReportInput): Promise<Report> {
    return this.repository.create(input);
  }

  async findById(id: string): Promise<Report> {
    const report = await this.repository.findById(id);
    if (!report) {
      throw new ReportNotFoundError(id);
    }
    return report;
  }

  async findAll(params?: ReportSearchParams): Promise<Report[]> {
    return this.repository.findAll(params);
  }

  async findBySiteInspectionId(siteInspectionId: string): Promise<Report[]> {
    return this.repository.findBySiteInspectionId(siteInspectionId);
  }

  async update(id: string, input: UpdateManagedReportInput): Promise<Report> {
    const existing = await this.findById(id);

    // Validate status transition if status is being changed
    if (input.status && input.status !== existing.status) {
      const validTargets = VALID_TRANSITIONS[existing.status];
      if (!validTargets.includes(input.status)) {
        throw new InvalidStatusTransitionError(existing.status, input.status);
      }
    }

    return this.repository.update(id, input);
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    return this.repository.delete(id);
  }

  /**
   * Submit report for review (DRAFT → REVIEW)
   */
  async submitForReview(id: string): Promise<Report> {
    return this.update(id, { status: 'REVIEW' });
  }

  /**
   * Request changes (REVIEW → DRAFT)
   */
  async requestChanges(id: string): Promise<Report> {
    return this.update(id, { status: 'DRAFT' });
  }

  /**
   * Approve report (REVIEW → APPROVED)
   */
  async approve(id: string, reviewedById: string): Promise<Report> {
    return this.update(id, {
      status: 'APPROVED',
      reviewedById,
      reviewedAt: new Date(),
    });
  }

  /**
   * Mark as generated (APPROVED → GENERATED)
   */
  async markGenerated(id: string, pdfPath: string, pdfSize: number): Promise<Report> {
    return this.update(id, {
      status: 'GENERATED',
      pdfPath,
      pdfSize,
      generatedAt: new Date(),
    });
  }

  /**
   * Mark as submitted (GENERATED → SUBMITTED)
   */
  async markSubmitted(id: string): Promise<Report> {
    return this.update(id, { status: 'SUBMITTED' });
  }
}
