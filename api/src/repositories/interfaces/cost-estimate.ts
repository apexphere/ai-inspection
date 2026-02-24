import type { CostEstimate, CostLineItem } from '@prisma/client';

export interface CreateCostEstimateInput {
  reportId: string;
  contingencyRate?: number;
  notes?: string;
}

export interface UpdateCostEstimateInput {
  contingencyRate?: number;
  notes?: string | null;
}

export interface CreateCostLineItemInput {
  costEstimateId: string;
  category: string;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  sortOrder?: number;
}

export interface UpdateCostLineItemInput {
  category?: string;
  description?: string;
  quantity?: number;
  unit?: string;
  rate?: number;
  sortOrder?: number;
}

export type CostEstimateWithLineItems = CostEstimate & {
  lineItems: CostLineItem[];
};

export interface ICostEstimateRepository {
  create(input: CreateCostEstimateInput): Promise<CostEstimate>;
  findById(id: string): Promise<CostEstimateWithLineItems | null>;
  findByReportId(reportId: string): Promise<CostEstimateWithLineItems | null>;
  update(id: string, input: UpdateCostEstimateInput): Promise<CostEstimate>;
  updateTotals(id: string, subtotal: number, totalExGst: number): Promise<CostEstimate>;
  delete(id: string): Promise<void>;
}

export interface ICostLineItemRepository {
  create(input: CreateCostLineItemInput): Promise<CostLineItem>;
  findById(id: string): Promise<CostLineItem | null>;
  findByCostEstimateId(costEstimateId: string): Promise<CostLineItem[]>;
  update(id: string, input: UpdateCostLineItemInput): Promise<CostLineItem>;
  delete(id: string): Promise<void>;
}
