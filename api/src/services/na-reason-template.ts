import type { NAReasonTemplate } from '@prisma/client';
import type { INAReasonTemplateRepository } from '../repositories/interfaces/na-reason-template.js';

export class NAReasonTemplateNotFoundError extends Error {
  constructor(id: string) {
    super(`N/A reason template not found: ${id}`);
    this.name = 'NAReasonTemplateNotFoundError';
  }
}

export class NAReasonTemplateService {
  constructor(private repository: INAReasonTemplateRepository) {}

  async findAll(): Promise<NAReasonTemplate[]> {
    return this.repository.findAll();
  }

  async findById(id: string): Promise<NAReasonTemplate> {
    const template = await this.repository.findById(id);
    if (!template) {
      throw new NAReasonTemplateNotFoundError(id);
    }
    return template;
  }
}
