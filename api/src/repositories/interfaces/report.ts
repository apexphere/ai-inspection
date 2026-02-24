/**
 * Report Repository Interface — Issue #192
 */

import type { Report, ReportType, ReportStatus } from '@prisma/client';

export interface CreateManagedReportInput {
  siteInspectionId: string;
  type: ReportType;
  preparedById: string;
  reviewedById?: string;
}

export interface UpdateManagedReportInput {
  status?: ReportStatus;
  version?: number;
  pdfPath?: string;
  pdfSize?: number;
  generatedAt?: Date;
  preparedById?: string;
  reviewedById?: string;
  reviewedAt?: Date;
  form9Data?: object;
}

export interface ReportSearchParams {
  siteInspectionId?: string;
  type?: ReportType;
  status?: ReportStatus;
  preparedById?: string;
}

export interface IReportManagementRepository {
  create(input: CreateManagedReportInput): Promise<Report>;
  findById(id: string): Promise<Report | null>;
  findAll(params?: ReportSearchParams): Promise<Report[]>;
  update(id: string, input: UpdateManagedReportInput): Promise<Report>;
  delete(id: string): Promise<void>;
  findBySiteInspectionId(siteInspectionId: string): Promise<Report[]>;
}
