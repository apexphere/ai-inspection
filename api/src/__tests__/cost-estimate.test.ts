import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { CostEstimate, CostLineItem } from '@prisma/client';
import {
  CostEstimateService,
  CostEstimateNotFoundError,
  CostEstimateAlreadyExistsError,
  CostLineItemNotFoundError,
} from '../services/cost-estimate.js';
import type {
  ICostEstimateRepository,
  ICostLineItemRepository,
  CostEstimateWithLineItems,
} from '../repositories/interfaces/cost-estimate.js';

function createMockEstimateRepo(): ICostEstimateRepository {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    findByReportId: vi.fn(),
    update: vi.fn(),
    updateTotals: vi.fn(),
    delete: vi.fn(),
  };
}

function createMockLineItemRepo(): ICostLineItemRepository {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    findByCostEstimateId: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
}

const now = new Date();

const sampleEstimate: CostEstimate = {
  id: 'ce-1',
  reportId: 'report-1',
  contingencyRate: 0.20,
  subtotal: 0,
  totalExGst: 0,
  notes: null,
  createdAt: now,
  updatedAt: now,
};

const sampleLineItem: CostLineItem = {
  id: 'cli-1',
  costEstimateId: 'ce-1',
  category: 'Plumbing',
  description: 'Replace shower base',
  quantity: 1,
  unit: 'each',
  rate: 500,
  amount: 500,
  sortOrder: 0,
  createdAt: now,
  updatedAt: now,
};

const sampleEstimateWithItems: CostEstimateWithLineItems = {
  ...sampleEstimate,
  lineItems: [],
};

// ─── CostEstimateService ─────────────────────────────────────────────────

describe('CostEstimateService', () => {
  let estimateRepo: ICostEstimateRepository;
  let lineItemRepo: ICostLineItemRepository;
  let service: CostEstimateService;

  beforeEach(() => {
    estimateRepo = createMockEstimateRepo();
    lineItemRepo = createMockLineItemRepo();
    service = new CostEstimateService(estimateRepo, lineItemRepo);
  });

  // ─── Create ─────────────────────────────────────────

  describe('create', () => {
    it('should create a cost estimate', async () => {
      (estimateRepo.findByReportId as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      (estimateRepo.create as ReturnType<typeof vi.fn>).mockResolvedValue(sampleEstimate);

      const result = await service.create({ reportId: 'report-1' });

      expect(result).toEqual(sampleEstimate);
      expect(estimateRepo.create).toHaveBeenCalledWith({ reportId: 'report-1' });
    });

    it('should throw if estimate already exists for report', async () => {
      (estimateRepo.findByReportId as ReturnType<typeof vi.fn>).mockResolvedValue(sampleEstimateWithItems);

      await expect(service.create({ reportId: 'report-1' }))
        .rejects.toThrow(CostEstimateAlreadyExistsError);
    });

    it('should accept custom contingency rate', async () => {
      (estimateRepo.findByReportId as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      (estimateRepo.create as ReturnType<typeof vi.fn>).mockResolvedValue({ ...sampleEstimate, contingencyRate: 0.15 });

      const result = await service.create({ reportId: 'report-1', contingencyRate: 0.15 });

      expect(result.contingencyRate).toBe(0.15);
    });
  });

  // ─── Find ─────────────────────────────────────────

  describe('findById', () => {
    it('should return estimate with line items', async () => {
      (estimateRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(sampleEstimateWithItems);

      const result = await service.findById('ce-1');
      expect(result).toEqual(sampleEstimateWithItems);
    });

    it('should throw if not found', async () => {
      (estimateRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await expect(service.findById('nope')).rejects.toThrow(CostEstimateNotFoundError);
    });
  });

  describe('findByReportId', () => {
    it('should return estimate by report id', async () => {
      (estimateRepo.findByReportId as ReturnType<typeof vi.fn>).mockResolvedValue(sampleEstimateWithItems);

      const result = await service.findByReportId('report-1');
      expect(result).toEqual(sampleEstimateWithItems);
    });

    it('should throw if not found', async () => {
      (estimateRepo.findByReportId as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await expect(service.findByReportId('nope')).rejects.toThrow(CostEstimateNotFoundError);
    });
  });

  // ─── Update ─────────────────────────────────────────

  describe('update', () => {
    it('should update contingency and recalculate totals', async () => {
      const withItems: CostEstimateWithLineItems = {
        ...sampleEstimate,
        lineItems: [sampleLineItem],
      };
      (estimateRepo.findById as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(withItems)  // findById in update
        .mockResolvedValueOnce({ ...withItems, contingencyRate: 0.10, subtotal: 500, totalExGst: 550 }); // findById at end
      (estimateRepo.update as ReturnType<typeof vi.fn>).mockResolvedValue(sampleEstimate);
      (estimateRepo.updateTotals as ReturnType<typeof vi.fn>).mockResolvedValue(sampleEstimate);

      const result = await service.update('ce-1', { contingencyRate: 0.10 });

      expect(estimateRepo.updateTotals).toHaveBeenCalledWith('ce-1', 500, 550);
    });

    it('should update notes without recalculating', async () => {
      (estimateRepo.findById as ReturnType<typeof vi.fn>)
        .mockResolvedValue(sampleEstimateWithItems);
      (estimateRepo.update as ReturnType<typeof vi.fn>).mockResolvedValue(sampleEstimate);

      await service.update('ce-1', { notes: 'new note' });

      expect(estimateRepo.updateTotals).not.toHaveBeenCalled();
    });
  });

  // ─── Delete ─────────────────────────────────────────

  describe('delete', () => {
    it('should delete an existing estimate', async () => {
      (estimateRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(sampleEstimateWithItems);
      (estimateRepo.delete as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      await service.delete('ce-1');

      expect(estimateRepo.delete).toHaveBeenCalledWith('ce-1');
    });

    it('should throw if not found', async () => {
      (estimateRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await expect(service.delete('nope')).rejects.toThrow(CostEstimateNotFoundError);
    });
  });

  // ─── Line Items ─────────────────────────────────────────

  describe('addLineItem', () => {
    it('should add a line item and recalculate totals', async () => {
      (estimateRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(sampleEstimateWithItems);
      (lineItemRepo.create as ReturnType<typeof vi.fn>).mockResolvedValue(sampleLineItem);
      (estimateRepo.updateTotals as ReturnType<typeof vi.fn>).mockResolvedValue(sampleEstimate);

      const result = await service.addLineItem({
        costEstimateId: 'ce-1',
        category: 'Plumbing',
        description: 'Replace shower base',
        quantity: 1,
        unit: 'each',
        rate: 500,
      });

      expect(result).toEqual(sampleLineItem);
      // subtotal = 500, totalExGst = 500 * 1.20 = 600
      expect(estimateRepo.updateTotals).toHaveBeenCalledWith('ce-1', 500, 600);
    });

    it('should accumulate with existing line items', async () => {
      const existingItems: CostEstimateWithLineItems = {
        ...sampleEstimate,
        lineItems: [sampleLineItem], // existing 500
      };
      const newItem: CostLineItem = { ...sampleLineItem, id: 'cli-2', amount: 300 };

      (estimateRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(existingItems);
      (lineItemRepo.create as ReturnType<typeof vi.fn>).mockResolvedValue(newItem);
      (estimateRepo.updateTotals as ReturnType<typeof vi.fn>).mockResolvedValue(sampleEstimate);

      await service.addLineItem({
        costEstimateId: 'ce-1',
        category: 'Roofing',
        description: 'Repair flashing',
        quantity: 1,
        unit: 'each',
        rate: 300,
      });

      // subtotal = 500 + 300 = 800, totalExGst = 800 * 1.20 = 960
      expect(estimateRepo.updateTotals).toHaveBeenCalledWith('ce-1', 800, 960);
    });
  });

  describe('updateLineItem', () => {
    it('should update a line item and recalculate totals', async () => {
      const updatedItem: CostLineItem = { ...sampleLineItem, quantity: 2, amount: 1000 };
      const estimateAfterUpdate: CostEstimateWithLineItems = {
        ...sampleEstimate,
        lineItems: [updatedItem],
      };

      (lineItemRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(sampleLineItem);
      (lineItemRepo.update as ReturnType<typeof vi.fn>).mockResolvedValue(updatedItem);
      (estimateRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(estimateAfterUpdate);
      (estimateRepo.updateTotals as ReturnType<typeof vi.fn>).mockResolvedValue(sampleEstimate);

      const result = await service.updateLineItem('cli-1', { quantity: 2 });

      expect(result).toEqual(updatedItem);
      // subtotal = 1000, totalExGst = 1000 * 1.20 = 1200
      expect(estimateRepo.updateTotals).toHaveBeenCalledWith('ce-1', 1000, 1200);
    });

    it('should throw if line item not found', async () => {
      (lineItemRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await expect(service.updateLineItem('nope', { quantity: 2 }))
        .rejects.toThrow(CostLineItemNotFoundError);
    });
  });

  describe('deleteLineItem', () => {
    it('should delete a line item and recalculate totals to zero', async () => {
      const estimateAfterDelete: CostEstimateWithLineItems = {
        ...sampleEstimate,
        lineItems: [], // empty after delete
      };

      (lineItemRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(sampleLineItem);
      (lineItemRepo.delete as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
      (estimateRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(estimateAfterDelete);
      (estimateRepo.updateTotals as ReturnType<typeof vi.fn>).mockResolvedValue(sampleEstimate);

      await service.deleteLineItem('cli-1');

      expect(lineItemRepo.delete).toHaveBeenCalledWith('cli-1');
      expect(estimateRepo.updateTotals).toHaveBeenCalledWith('ce-1', 0, 0);
    });

    it('should throw if line item not found', async () => {
      (lineItemRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await expect(service.deleteLineItem('nope'))
        .rejects.toThrow(CostLineItemNotFoundError);
    });
  });
});
