/**
 * Report Validation Service — Issue #195
 *
 * Validates report data completeness before PDF generation.
 * Checks all validation rules and returns all errors at once (no short-circuit).
 */

import type { PrismaClient } from '@prisma/client';

export interface ValidationError {
  type:
    | 'missing_observation'
    | 'missing_caption'
    | 'missing_document'
    | 'not_approved'
    | 'no_applicable_clauses'
    | 'missing_inspector';
  field?: string;
  entityId?: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

export class ReportNotFoundError extends Error {
  constructor(id: string) {
    super(`Report not found: ${id}`);
    this.name = 'ReportNotFoundError';
  }
}

export class ReportValidationService {
  constructor(private prisma: PrismaClient) {}

  async validate(reportId: string): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    // Fetch report with related data
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
      include: {
        siteInspection: {
          include: {
            project: {
              include: {
                photos: true,
                documents: true,
              },
            },
            clauseReviews: true,
          },
        },
      },
    });

    if (!report) {
      throw new ReportNotFoundError(reportId);
    }

    // Rule 1: Report status must be APPROVED or FINALIZED
    if (report.status !== 'APPROVED' && report.status !== 'FINALIZED') {
      errors.push({
        type: 'not_approved',
        field: 'status',
        message: `Report must be APPROVED or FINALIZED for generation, current status: ${report.status}`,
      });
    }

    const siteInspection = report.siteInspection;
    if (!siteInspection) {
      // If no site inspection linked, we can't validate further
      errors.push({
        type: 'missing_inspector',
        message: 'Report has no linked site inspection',
      });
      return { valid: false, errors, warnings };
    }

    // Rule 6: SiteInspection must have an inspector
    if (!siteInspection.inspectorName || siteInspection.inspectorName.trim() === '') {
      errors.push({
        type: 'missing_inspector',
        field: 'inspectorName',
        message: 'Site inspection must have an inspector name',
      });
    }

    // Rule 2: All applicable clause reviews must have observations
    const applicableClauseReviews = siteInspection.clauseReviews.filter(
      (cr) => cr.applicability === 'APPLICABLE'
    );

    for (const clauseReview of applicableClauseReviews) {
      if (!clauseReview.observations || clauseReview.observations.trim() === '') {
        errors.push({
          type: 'missing_observation',
          field: 'observations',
          entityId: clauseReview.id,
          message: `Clause review ${clauseReview.clauseId} is missing observations`,
        });
      }
    }

    // Rule 5: At least one applicable clause (warning, not blocking)
    if (applicableClauseReviews.length === 0) {
      warnings.push('No applicable clauses found in clause reviews');
    }

    const project = siteInspection.project;

    // Rule 3: All project photos must have captions
    for (const photo of project.photos) {
      if (!photo.caption || photo.caption.trim() === '') {
        errors.push({
          type: 'missing_caption',
          field: 'caption',
          entityId: photo.id,
          message: `Photo ${photo.reportNumber} is missing a caption`,
        });
      }
    }

    // Rule 4: All required documents must be received
    const requiredDocuments = project.documents.filter((doc) => doc.status === 'REQUIRED');
    for (const doc of requiredDocuments) {
      errors.push({
        type: 'missing_document',
        field: 'status',
        entityId: doc.id,
        message: `Required document "${doc.description}" has not been received`,
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
