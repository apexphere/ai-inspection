import type { ReportTemplate, TemplateType, ReportType } from '@prisma/client';

export interface CreateReportTemplateInput {
  name: string;
  type: TemplateType;
  reportType?: ReportType;
  content: string;
  variables?: string[];
  version?: number;
  isDefault?: boolean;
}

export interface UpdateReportTemplateInput {
  name?: string;
  content?: string;
  variables?: string[];
  isDefault?: boolean;
  isActive?: boolean;
}

export interface ReportTemplateSearchParams {
  type?: TemplateType;
  reportType?: ReportType;
  isDefault?: boolean;
  isActive?: boolean;
  name?: string;
}

export interface IReportTemplateRepository {
  create(input: CreateReportTemplateInput): Promise<ReportTemplate>;
  findById(id: string): Promise<ReportTemplate | null>;
  findAll(params?: ReportTemplateSearchParams): Promise<ReportTemplate[]>;
  findByType(type: TemplateType, reportType?: ReportType): Promise<ReportTemplate[]>;
  findVersions(name: string, type: TemplateType): Promise<ReportTemplate[]>;
  update(id: string, input: UpdateReportTemplateInput): Promise<ReportTemplate>;
  delete(id: string): Promise<void>;
}
