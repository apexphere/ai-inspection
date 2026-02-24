import type { PrismaClient, ReportTemplate, TemplateType, ReportType } from '@prisma/client';
import type {
  IReportTemplateRepository,
  CreateReportTemplateInput,
  UpdateReportTemplateInput,
  ReportTemplateSearchParams,
} from '../interfaces/report-template.js';

export class PrismaReportTemplateRepository implements IReportTemplateRepository {
  constructor(private prisma: PrismaClient) {}

  async create(input: CreateReportTemplateInput): Promise<ReportTemplate> {
    return this.prisma.reportTemplate.create({
      data: {
        name: input.name,
        type: input.type,
        reportType: input.reportType,
        content: input.content,
        variables: input.variables ?? [],
        version: input.version ?? 1,
        isDefault: input.isDefault ?? false,
      },
    });
  }

  async findById(id: string): Promise<ReportTemplate | null> {
    return this.prisma.reportTemplate.findUnique({ where: { id } });
  }

  async findAll(params?: ReportTemplateSearchParams): Promise<ReportTemplate[]> {
    return this.prisma.reportTemplate.findMany({
      where: {
        type: params?.type,
        reportType: params?.reportType ?? undefined,
        isDefault: params?.isDefault,
        isActive: params?.isActive ?? true,
        name: params?.name ? { contains: params.name, mode: 'insensitive' } : undefined,
      },
      orderBy: [{ name: 'asc' }, { version: 'desc' }],
    });
  }

  async findByType(type: TemplateType, reportType?: ReportType): Promise<ReportTemplate[]> {
    return this.prisma.reportTemplate.findMany({
      where: {
        type,
        reportType: reportType ?? undefined,
        isActive: true,
      },
      orderBy: [{ name: 'asc' }, { version: 'desc' }],
    });
  }

  async findVersions(name: string, type: TemplateType): Promise<ReportTemplate[]> {
    return this.prisma.reportTemplate.findMany({
      where: { name, type },
      orderBy: { version: 'desc' },
    });
  }

  async update(id: string, input: UpdateReportTemplateInput): Promise<ReportTemplate> {
    return this.prisma.reportTemplate.update({
      where: { id },
      data: {
        name: input.name,
        content: input.content,
        variables: input.variables,
        isDefault: input.isDefault,
        isActive: input.isActive,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.reportTemplate.delete({ where: { id } });
  }
}
