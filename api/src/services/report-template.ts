import type { ReportTemplate, TemplateType, ReportType } from '@prisma/client';
import type {
  IReportTemplateRepository,
  CreateReportTemplateInput,
  UpdateReportTemplateInput,
  ReportTemplateSearchParams,
} from '../repositories/interfaces/report-template.js';

export class ReportTemplateNotFoundError extends Error {
  constructor(id: string) {
    super(`Report template not found: ${id}`);
    this.name = 'ReportTemplateNotFoundError';
  }
}

export interface CreateVersionInput {
  content: string;
  variables?: string[];
  isDefault?: boolean;
}

export class ReportTemplateService {
  constructor(private repository: IReportTemplateRepository) {}

  async create(input: CreateReportTemplateInput): Promise<ReportTemplate> {
    return this.repository.create(input);
  }

  async findById(id: string): Promise<ReportTemplate> {
    const template = await this.repository.findById(id);
    if (!template) throw new ReportTemplateNotFoundError(id);
    return template;
  }

  async findAll(params?: ReportTemplateSearchParams): Promise<ReportTemplate[]> {
    return this.repository.findAll(params);
  }

  async findByType(type: TemplateType, reportType?: ReportType): Promise<ReportTemplate[]> {
    return this.repository.findByType(type, reportType);
  }

  async update(id: string, input: UpdateReportTemplateInput): Promise<ReportTemplate> {
    await this.findById(id); // verify exists
    return this.repository.update(id, input);
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.repository.delete(id);
  }

  /**
   * Create a new version of an existing template.
   * Copies metadata from the source, increments version number.
   */
  async createVersion(id: string, input: CreateVersionInput): Promise<ReportTemplate> {
    const source = await this.findById(id);

    const versions = await this.repository.findVersions(source.name, source.type);
    const maxVersion = versions.reduce((max, t) => Math.max(max, t.version), 0);

    return this.repository.create({
      name: source.name,
      type: source.type,
      reportType: source.reportType ?? undefined,
      content: input.content,
      variables: input.variables ?? source.variables,
      version: maxVersion + 1,
      isDefault: input.isDefault ?? false,
    });
  }

  /**
   * Get all versions of a template by name and type.
   */
  async getVersionHistory(id: string): Promise<ReportTemplate[]> {
    const template = await this.findById(id);
    return this.repository.findVersions(template.name, template.type);
  }

  /**
   * Mark a specific template version as the default (and unmark others with same name+type).
   */
  async setDefault(id: string): Promise<ReportTemplate> {
    const template = await this.findById(id);

    // Unmark any existing defaults for this name+type
    const siblings = await this.repository.findVersions(template.name, template.type);
    await Promise.all(
      siblings
        .filter((t) => t.isDefault && t.id !== id)
        .map((t) => this.repository.update(t.id, { isDefault: false }))
    );

    return this.repository.update(id, { isDefault: true });
  }
}
