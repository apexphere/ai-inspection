import type { CostEstimate, CostLineItem } from '@prisma/client';
import type {
  ICostEstimateRepository,
  ICostLineItemRepository,
  CreateCostEstimateInput,
  UpdateCostEstimateInput,
  CreateCostLineItemInput,
  UpdateCostLineItemInput,
  CostEstimateWithLineItems,
} from '../repositories/interfaces/cost-estimate.js';

export class CostEstimateNotFoundError extends Error {
  constructor(id: string) {
    super(`Cost estimate not found: ${id}`);
    this.name = 'CostEstimateNotFoundError';
  }
}

export class CostLineItemNotFoundError extends Error {
  constructor(id: string) {
    super(`Cost line item not found: ${id}`);
    this.name = 'CostLineItemNotFoundError';
  }
}

export class CostEstimateAlreadyExistsError extends Error {
  constructor(reportId: string) {
    super(`Cost estimate already exists for report: ${reportId}`);
    this.name = 'CostEstimateAlreadyExistsError';
  }
}

/**
 * Recalculate subtotal and totalExGst from line items.
 * subtotal = sum of all line item amounts
 * totalExGst = subtotal * (1 + contingencyRate)
 */
function calculateTotals(lineItems: CostLineItem[], contingencyRate: number): { subtotal: number; totalExGst: number } {
  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const totalExGst = subtotal * (1 + contingencyRate);
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    totalExGst: Math.round(totalExGst * 100) / 100,
  };
}

export class CostEstimateService {
  constructor(
    private estimateRepo: ICostEstimateRepository,
    private lineItemRepo: ICostLineItemRepository,
  ) {}

  async create(input: CreateCostEstimateInput): Promise<CostEstimate> {
    // Check if estimate already exists for this report
    const existing = await this.estimateRepo.findByReportId(input.reportId);
    if (existing) {
      throw new CostEstimateAlreadyExistsError(input.reportId);
    }
    return this.estimateRepo.create(input);
  }

  async findById(id: string): Promise<CostEstimateWithLineItems> {
    const estimate = await this.estimateRepo.findById(id);
    if (!estimate) {
      throw new CostEstimateNotFoundError(id);
    }
    return estimate;
  }

  async findByReportId(reportId: string): Promise<CostEstimateWithLineItems> {
    const estimate = await this.estimateRepo.findByReportId(reportId);
    if (!estimate) {
      throw new CostEstimateNotFoundError(`report:${reportId}`);
    }
    return estimate;
  }

  async update(id: string, input: UpdateCostEstimateInput): Promise<CostEstimateWithLineItems> {
    const existing = await this.findById(id);
    await this.estimateRepo.update(id, input);

    // If contingency rate changed, recalculate totals
    if (input.contingencyRate !== undefined) {
      const { subtotal, totalExGst } = calculateTotals(
        existing.lineItems,
        input.contingencyRate,
      );
      await this.estimateRepo.updateTotals(id, subtotal, totalExGst);
    }

    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.estimateRepo.delete(id);
  }

  // --- Line Items ---

  async addLineItem(input: CreateCostLineItemInput): Promise<CostLineItem> {
    const estimate = await this.findById(input.costEstimateId);
    const lineItem = await this.lineItemRepo.create(input);

    // Recalculate totals
    const allItems = [...estimate.lineItems, lineItem];
    const { subtotal, totalExGst } = calculateTotals(allItems, estimate.contingencyRate);
    await this.estimateRepo.updateTotals(estimate.id, subtotal, totalExGst);

    return lineItem;
  }

  async updateLineItem(id: string, input: UpdateCostLineItemInput): Promise<CostLineItem> {
    const existing = await this.lineItemRepo.findById(id);
    if (!existing) {
      throw new CostLineItemNotFoundError(id);
    }

    const lineItem = await this.lineItemRepo.update(id, input);

    // Recalculate totals
    const estimate = await this.findById(existing.costEstimateId);
    const { subtotal, totalExGst } = calculateTotals(estimate.lineItems, estimate.contingencyRate);
    await this.estimateRepo.updateTotals(estimate.id, subtotal, totalExGst);

    return lineItem;
  }

  async deleteLineItem(id: string): Promise<void> {
    const existing = await this.lineItemRepo.findById(id);
    if (!existing) {
      throw new CostLineItemNotFoundError(id);
    }

    await this.lineItemRepo.delete(id);

    // Recalculate totals
    const estimate = await this.findById(existing.costEstimateId);
    const { subtotal, totalExGst } = calculateTotals(estimate.lineItems, estimate.contingencyRate);
    await this.estimateRepo.updateTotals(estimate.id, subtotal, totalExGst);
  }
}
