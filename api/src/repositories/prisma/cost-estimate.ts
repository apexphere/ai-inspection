import type { PrismaClient, CostEstimate, CostLineItem } from '@prisma/client';
import type {
  ICostEstimateRepository,
  ICostLineItemRepository,
  CreateCostEstimateInput,
  UpdateCostEstimateInput,
  CreateCostLineItemInput,
  UpdateCostLineItemInput,
  CostEstimateWithLineItems,
} from '../interfaces/cost-estimate.js';

export class PrismaCostEstimateRepository implements ICostEstimateRepository {
  constructor(private prisma: PrismaClient) {}

  async create(input: CreateCostEstimateInput): Promise<CostEstimate> {
    return this.prisma.costEstimate.create({
      data: {
        reportId: input.reportId,
        contingencyRate: input.contingencyRate ?? 0.20,
        notes: input.notes,
      },
    });
  }

  async findById(id: string): Promise<CostEstimateWithLineItems | null> {
    return this.prisma.costEstimate.findUnique({
      where: { id },
      include: { lineItems: { orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }] } },
    });
  }

  async findByReportId(reportId: string): Promise<CostEstimateWithLineItems | null> {
    return this.prisma.costEstimate.findUnique({
      where: { reportId },
      include: { lineItems: { orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }] } },
    });
  }

  async update(id: string, input: UpdateCostEstimateInput): Promise<CostEstimate> {
    return this.prisma.costEstimate.update({
      where: { id },
      data: {
        contingencyRate: input.contingencyRate,
        notes: input.notes,
      },
    });
  }

  async updateTotals(id: string, subtotal: number, totalExGst: number): Promise<CostEstimate> {
    return this.prisma.costEstimate.update({
      where: { id },
      data: { subtotal, totalExGst },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.costEstimate.delete({ where: { id } });
  }
}

export class PrismaCostLineItemRepository implements ICostLineItemRepository {
  constructor(private prisma: PrismaClient) {}

  async create(input: CreateCostLineItemInput): Promise<CostLineItem> {
    return this.prisma.costLineItem.create({
      data: {
        costEstimateId: input.costEstimateId,
        category: input.category,
        description: input.description,
        quantity: input.quantity,
        unit: input.unit,
        rate: input.rate,
        amount: input.quantity * input.rate,
        sortOrder: input.sortOrder ?? 0,
      },
    });
  }

  async findById(id: string): Promise<CostLineItem | null> {
    return this.prisma.costLineItem.findUnique({ where: { id } });
  }

  async findByCostEstimateId(costEstimateId: string): Promise<CostLineItem[]> {
    return this.prisma.costLineItem.findMany({
      where: { costEstimateId },
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async update(id: string, input: UpdateCostLineItemInput): Promise<CostLineItem> {
    // If quantity or rate changed, recalculate amount
    const existing = await this.prisma.costLineItem.findUniqueOrThrow({ where: { id } });
    const quantity = input.quantity ?? existing.quantity;
    const rate = input.rate ?? existing.rate;

    return this.prisma.costLineItem.update({
      where: { id },
      data: {
        category: input.category,
        description: input.description,
        quantity: input.quantity,
        unit: input.unit,
        rate: input.rate,
        amount: quantity * rate,
        sortOrder: input.sortOrder,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.costLineItem.delete({ where: { id } });
  }
}
