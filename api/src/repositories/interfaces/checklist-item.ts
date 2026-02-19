import type { ChecklistItem, ChecklistCategory, Decision } from '@prisma/client';

export interface CreateChecklistItemInput {
  inspectionId: string;
  category: ChecklistCategory;
  item: string;
  decision: Decision;
  notes?: string;
  photoIds?: string[];
  sortOrder?: number;
}

export interface UpdateChecklistItemInput {
  category?: ChecklistCategory;
  item?: string;
  decision?: Decision;
  notes?: string;
  photoIds?: string[];
  sortOrder?: number;
}

export interface ChecklistItemSearchParams {
  inspectionId?: string;
  category?: ChecklistCategory;
  decision?: Decision;
}

export interface IChecklistItemRepository {
  create(input: CreateChecklistItemInput): Promise<ChecklistItem>;
  findById(id: string): Promise<ChecklistItem | null>;
  findByInspectionId(inspectionId: string): Promise<ChecklistItem[]>;
  findAll(params?: ChecklistItemSearchParams): Promise<ChecklistItem[]>;
  update(id: string, input: UpdateChecklistItemInput): Promise<ChecklistItem>;
  delete(id: string): Promise<void>;
  bulkCreate(items: CreateChecklistItemInput[]): Promise<ChecklistItem[]>;
  reorder(inspectionId: string, itemIds: string[]): Promise<void>;
}
