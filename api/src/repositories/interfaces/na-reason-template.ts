import type { NAReasonTemplate } from '@prisma/client';

export interface INAReasonTemplateRepository {
  findAll(): Promise<NAReasonTemplate[]>;
  findById(id: string): Promise<NAReasonTemplate | null>;
}
