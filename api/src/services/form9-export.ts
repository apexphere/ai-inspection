/**
 * Form 9 Data Export Service — Issue #196
 *
 * Extracts Form 9 data from report/inspection/project data
 * for council submission (Certificate of Acceptance application).
 *
 * Form 9 Sections:
 * - Part A: Applicant details (from client)
 * - Part B: Building work details (from project/property)
 * - Part C: Clauses claimed compliant (from clause reviews)
 * - Part D: Limitations (from inspection)
 * - Part E: Supporting documents (from project documents)
 * - Part F: Inspection details (from site inspection)
 */

import type { PrismaClient } from '@prisma/client';

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

export interface Form9Data {
  partA: Form9PartA;
  partB: Form9PartB;
  partC: Form9PartC;
  partD: Form9PartD;
  partE: Form9PartE;
  partF: Form9PartF;
  exportedAt: string;
}

export interface Form9PartA {
  applicantName: string;
  applicantAddress: string | null;
  applicantPhone: string | null;
  applicantEmail: string | null;
  contactPerson: string | null;
}

export interface Form9PartB {
  propertyAddress: string;
  lotDp: string | null;
  councilPropertyId: string | null;
  territorialAuthority: string;
  jobNumber: string;
  activity: string;
  reportType: string;
}

export interface Form9PartC {
  compliantClauses: Form9ClauseEntry[];
  nonApplicableClauses: Form9ClauseEntry[];
}

export interface Form9ClauseEntry {
  code: string;
  title: string;
  observations: string | null;
}

export interface Form9PartD {
  limitations: string[];
}

export interface Form9PartE {
  documents: Form9DocumentEntry[];
}

export interface Form9DocumentEntry {
  type: string;
  filename: string;
  description: string;
  status: string;
  referenceNumber: string | null;
}

export interface Form9PartF {
  inspectionDate: string | null;
  inspectorName: string;
  weather: string | null;
  methodology: string | null;
  areasNotAccessed: string | null;
  outcome: string | null;
}

// ──────────────────────────────────────────────────────────────────────────────
// Errors
// ──────────────────────────────────────────────────────────────────────────────

export class ReportNotFoundError extends Error {
  constructor(id: string) {
    super(`Report not found: ${id}`);
    this.name = 'ReportNotFoundError';
  }
}

export class InspectionNotLinkedError extends Error {
  constructor(reportId: string) {
    super(`Report ${reportId} has no linked site inspection`);
    this.name = 'InspectionNotLinkedError';
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Service
// ──────────────────────────────────────────────────────────────────────────────

export class Form9ExportService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Extract Form 9 data for a report.
   * Pulls data from the report's linked site inspection, project, property,
   * client, clause reviews, and documents.
   */
  async extract(reportId: string): Promise<Form9Data> {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
      include: {
        siteInspection: {
          include: {
            project: {
              include: {
                property: true,
                client: true,
                documents: true,
              },
            },
            clauseReviews: {
              include: { clause: true },
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
      },
    });

    if (!report) throw new ReportNotFoundError(reportId);
    if (!report.siteInspection) throw new InspectionNotLinkedError(reportId);

    const inspection = report.siteInspection;
    const project = inspection.project;
    const property = project.property;
    const client = project.client;

    // Part A: Applicant details
    const partA: Form9PartA = {
      applicantName: client.name,
      applicantAddress: client.address,
      applicantPhone: client.phone,
      applicantEmail: client.email,
      contactPerson: client.contactPerson,
    };

    // Part B: Building work
    const partB: Form9PartB = {
      propertyAddress: property.streetAddress,
      lotDp: property.lotDp,
      councilPropertyId: property.councilPropertyId,
      territorialAuthority: property.territorialAuthority,
      jobNumber: project.jobNumber,
      activity: project.activity,
      reportType: project.reportType,
    };

    // Part C: Clauses
    const compliantClauses: Form9ClauseEntry[] = [];
    const nonApplicableClauses: Form9ClauseEntry[] = [];

    for (const review of inspection.clauseReviews) {
      const entry: Form9ClauseEntry = {
        code: review.clause.code,
        title: review.clause.title,
        observations: review.observations,
      };

      if (review.applicability === 'APPLICABLE') {
        compliantClauses.push(entry);
      } else {
        nonApplicableClauses.push(entry);
      }
    }

    const partC: Form9PartC = { compliantClauses, nonApplicableClauses };

    // Part D: Limitations
    const limitations: string[] = [];
    if (inspection.areasNotAccessed) {
      limitations.push(`Areas not accessed: ${inspection.areasNotAccessed}`);
    }
    // Could extend with more limitation sources in future

    const partD: Form9PartD = { limitations };

    // Part E: Documents
    const partE: Form9PartE = {
      documents: project.documents.map((doc) => ({
        type: doc.documentType,
        filename: doc.filename,
        description: doc.description,
        status: doc.status,
        referenceNumber: doc.referenceNumber,
      })),
    };

    // Part F: Inspection details
    const partF: Form9PartF = {
      inspectionDate: inspection.date.toISOString(),
      inspectorName: inspection.inspectorName,
      weather: inspection.weather,
      methodology: inspection.methodology,
      areasNotAccessed: inspection.areasNotAccessed,
      outcome: inspection.outcome,
    };

    const form9Data: Form9Data = {
      partA,
      partB,
      partC,
      partD,
      partE,
      partF,
      exportedAt: new Date().toISOString(),
    };

    // Also store on the report for caching
    await this.prisma.report.update({
      where: { id: reportId },
      data: { form9Data: form9Data as unknown as Record<string, unknown> },
    });

    return form9Data;
  }
}
