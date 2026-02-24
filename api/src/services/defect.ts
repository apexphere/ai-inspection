/**
 * Defect Service — Issue #218
 */

import type { Defect } from '@prisma/client';
import type { IDefectRepository, CreateDefectData, UpdateDefectData } from '../repositories/interfaces/defect.js';

export class DefectNotFoundError extends Error {
  constructor(id: string) {
    super(`Defect not found: ${id}`);
    this.name = 'DefectNotFoundError';
  }
}

export class DefectService {
  constructor(private repository: IDefectRepository) {}

  /**
   * Generate next defect number for an inspection (D-001, D-002, ...)
   */
  private async generateDefectNumber(inspectionId: string): Promise<string> {
    const count = await this.repository.countByInspectionId(inspectionId);
    const nextNumber = count + 1;
    return `D-${String(nextNumber).padStart(3, '0')}`;
  }

  async create(data: Omit<CreateDefectData, 'defectNumber'>): Promise<Defect> {
    const defectNumber = await this.generateDefectNumber(data.inspectionId);
    return this.repository.create({
      ...data,
      defectNumber,
    });
  }

  async findById(id: string): Promise<Defect> {
    const defect = await this.repository.findById(id);
    if (!defect) {
      throw new DefectNotFoundError(id);
    }
    return defect;
  }

  async findByInspectionId(inspectionId: string): Promise<Defect[]> {
    return this.repository.findByInspectionId(inspectionId);
  }

  async update(id: string, data: UpdateDefectData): Promise<Defect> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new DefectNotFoundError(id);
    }
    return this.repository.update(id, data);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new DefectNotFoundError(id);
    }
    await this.repository.delete(id);
  }
}
