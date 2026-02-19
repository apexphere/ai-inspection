import { PrismaClient, type ChecklistItem } from '@prisma/client';
import type {
  IChecklistItemRepository,
  CreateChecklistItemInput,
  UpdateChecklistItemInput,
  ChecklistItemSearchParams,
} from '../interfaces/checklist-item.js';

export class PrismaChecklistItemRepository implements IChecklistItemRepository {
  constructor(private prisma: PrismaClient) {}

  async create(input: CreateChecklistItemInput): Promise<ChecklistItem> {
    return this.prisma.checklistItem.create({
      data: input,
    });
  }

  async findById(id: string): Promise<ChecklistItem | null> {
    return this.prisma.checklistItem.findUnique({
      where: { id },
    });
  }

  async findByInspectionId(inspectionId: string): Promise<ChecklistItem[]> {
    return this.prisma.checklistItem.findMany({
      where: { inspectionId },
      orderBy: [
        { category: 'asc' },
        { sortOrder: 'asc' },
        { createdAt: 'asc' },
      ],
    });
  }

  async findAll(params?: ChecklistItemSearchParams): Promise<ChecklistItem[]> {
    const where: Record<string, unknown> = {};

    if (params?.inspectionId) {
      where.inspectionId = params.inspectionId;
    }
    if (params?.category) {
      where.category = params.category;
    }
    if (params?.decision) {
      where.decision = params.decision;
    }

    return this.prisma.checklistItem.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { sortOrder: 'asc' },
        { createdAt: 'asc' },
      ],
    });
  }

  async update(id: string, input: UpdateChecklistItemInput): Promise<ChecklistItem> {
    return this.prisma.checklistItem.update({
      where: { id },
      data: input,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.checklistItem.delete({
      where: { id },
    });
  }

  async bulkCreate(items: CreateChecklistItemInput[]): Promise<ChecklistItem[]> {
    // Use transaction for bulk create
    return this.prisma.$transaction(
      items.map((item) =>
        this.prisma.checklistItem.create({ data: item })
      )
    );
  }

  async reorder(inspectionId: string, itemIds: string[]): Promise<void> {
    await this.prisma.$transaction(
      itemIds.map((id, index) =>
        this.prisma.checklistItem.update({
          where: { id },
          data: { sortOrder: index },
        })
      )
    );
  }
}
