import type { ChecklistItem, ChecklistCategory } from '@prisma/client';
import type {
  IChecklistItemRepository,
  CreateChecklistItemInput,
  UpdateChecklistItemInput,
  ChecklistItemSearchParams,
} from '../repositories/interfaces/checklist-item.js';

export class ChecklistItemNotFoundError extends Error {
  constructor(id: string) {
    super(`Checklist item not found: ${id}`);
    this.name = 'ChecklistItemNotFoundError';
  }
}

export interface ChecklistSummary {
  total: number;
  passed: number;
  failed: number;
  na: number;
  byCategory: Record<string, { passed: number; failed: number; na: number }>;
  failedItemsWithoutNotes: string[];
  overallResult: 'PASS' | 'FAIL' | 'INCOMPLETE';
}

export class ChecklistItemService {
  constructor(private repository: IChecklistItemRepository) {}

  async create(input: CreateChecklistItemInput): Promise<ChecklistItem> {
    return this.repository.create(input);
  }

  async findAll(params?: ChecklistItemSearchParams): Promise<ChecklistItem[]> {
    return this.repository.findAll(params);
  }

  async findById(id: string): Promise<ChecklistItem> {
    const item = await this.repository.findById(id);
    if (!item) {
      throw new ChecklistItemNotFoundError(id);
    }
    return item;
  }

  async findByInspectionId(inspectionId: string): Promise<ChecklistItem[]> {
    return this.repository.findByInspectionId(inspectionId);
  }

  async update(id: string, input: UpdateChecklistItemInput): Promise<ChecklistItem> {
    await this.findById(id);
    return this.repository.update(id, input);
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.repository.delete(id);
  }

  async bulkCreate(items: CreateChecklistItemInput[]): Promise<ChecklistItem[]> {
    return this.repository.bulkCreate(items);
  }

  async reorder(inspectionId: string, itemIds: string[]): Promise<void> {
    return this.repository.reorder(inspectionId, itemIds);
  }

  async getSummary(inspectionId: string): Promise<ChecklistSummary> {
    const items = await this.findByInspectionId(inspectionId);

    const summary: ChecklistSummary = {
      total: items.length,
      passed: 0,
      failed: 0,
      na: 0,
      byCategory: {},
      failedItemsWithoutNotes: [],
      overallResult: 'INCOMPLETE',
    };

    for (const item of items) {
      // Count by decision
      if (item.decision === 'PASS') {
        summary.passed++;
      } else if (item.decision === 'FAIL') {
        summary.failed++;
        // Track failed items without notes
        if (!item.notes || item.notes.trim() === '') {
          summary.failedItemsWithoutNotes.push(item.id);
        }
      } else if (item.decision === 'NA') {
        summary.na++;
      }

      // Count by category
      const category = item.category;
      if (!summary.byCategory[category]) {
        summary.byCategory[category] = { passed: 0, failed: 0, na: 0 };
      }
      if (item.decision === 'PASS') {
        summary.byCategory[category].passed++;
      } else if (item.decision === 'FAIL') {
        summary.byCategory[category].failed++;
      } else if (item.decision === 'NA') {
        summary.byCategory[category].na++;
      }
    }

    // Calculate overall result
    if (items.length === 0) {
      summary.overallResult = 'INCOMPLETE';
    } else if (summary.failed > 0) {
      summary.overallResult = 'FAIL';
    } else if (summary.passed + summary.na === items.length) {
      summary.overallResult = 'PASS';
    } else {
      summary.overallResult = 'INCOMPLETE';
    }

    return summary;
  }

  async getGroupedByCategory(inspectionId: string): Promise<Record<ChecklistCategory, ChecklistItem[]>> {
    const items = await this.findByInspectionId(inspectionId);
    
    const grouped: Record<string, ChecklistItem[]> = {};
    for (const item of items) {
      if (!grouped[item.category]) {
        grouped[item.category] = [];
      }
      grouped[item.category].push(item);
    }
    
    return grouped as Record<ChecklistCategory, ChecklistItem[]>;
  }
}
