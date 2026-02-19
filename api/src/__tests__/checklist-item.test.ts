import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ChecklistItemService,
  ChecklistItemNotFoundError,
} from '../services/checklist-item.js';
import type { IChecklistItemRepository } from '../repositories/interfaces/checklist-item.js';
import type { ChecklistItem } from '@prisma/client';

// Mock repository
const createMockRepository = (): IChecklistItemRepository => ({
  create: vi.fn(),
  findById: vi.fn(),
  findByInspectionId: vi.fn(),
  findAll: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  bulkCreate: vi.fn(),
  reorder: vi.fn(),
});

const mockChecklistItem: ChecklistItem = {
  id: 'item-1',
  inspectionId: 'insp-1',
  category: 'EXTERIOR',
  item: 'Roof cladding / flashings',
  decision: 'PASS',
  notes: null,
  photoIds: [],
  sortOrder: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('ChecklistItemService', () => {
  let repository: IChecklistItemRepository;
  let service: ChecklistItemService;

  beforeEach(() => {
    repository = createMockRepository();
    service = new ChecklistItemService(repository);
  });

  describe('create', () => {
    it('should create a checklist item', async () => {
      vi.mocked(repository.create).mockResolvedValue(mockChecklistItem);

      const result = await service.create({
        inspectionId: 'insp-1',
        category: 'EXTERIOR',
        item: 'Roof cladding / flashings',
        decision: 'PASS',
      });

      expect(repository.create).toHaveBeenCalled();
      expect(result).toEqual(mockChecklistItem);
    });
  });

  describe('findById', () => {
    it('should return item by id', async () => {
      vi.mocked(repository.findById).mockResolvedValue(mockChecklistItem);

      const result = await service.findById('item-1');
      expect(result).toEqual(mockChecklistItem);
    });

    it('should throw ChecklistItemNotFoundError for non-existent item', async () => {
      vi.mocked(repository.findById).mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(
        ChecklistItemNotFoundError
      );
    });
  });

  describe('findByInspectionId', () => {
    it('should return all items for inspection', async () => {
      vi.mocked(repository.findByInspectionId).mockResolvedValue([mockChecklistItem]);

      const result = await service.findByInspectionId('insp-1');
      expect(result).toEqual([mockChecklistItem]);
    });
  });

  describe('update', () => {
    it('should update checklist item', async () => {
      const updatedItem = { ...mockChecklistItem, decision: 'FAIL' as const, notes: 'Damage found' };
      vi.mocked(repository.findById).mockResolvedValue(mockChecklistItem);
      vi.mocked(repository.update).mockResolvedValue(updatedItem);

      const result = await service.update('item-1', { decision: 'FAIL', notes: 'Damage found' });
      expect(result.decision).toBe('FAIL');
      expect(result.notes).toBe('Damage found');
    });

    it('should throw ChecklistItemNotFoundError for non-existent item', async () => {
      vi.mocked(repository.findById).mockResolvedValue(null);

      await expect(
        service.update('non-existent', { decision: 'FAIL' })
      ).rejects.toThrow(ChecklistItemNotFoundError);
    });
  });

  describe('delete', () => {
    it('should delete existing item', async () => {
      vi.mocked(repository.findById).mockResolvedValue(mockChecklistItem);
      vi.mocked(repository.delete).mockResolvedValue();

      await expect(service.delete('item-1')).resolves.toBeUndefined();
      expect(repository.delete).toHaveBeenCalledWith('item-1');
    });

    it('should throw ChecklistItemNotFoundError for non-existent item', async () => {
      vi.mocked(repository.findById).mockResolvedValue(null);

      await expect(service.delete('non-existent')).rejects.toThrow(
        ChecklistItemNotFoundError
      );
    });
  });

  describe('bulkCreate', () => {
    it('should create multiple items', async () => {
      const items = [mockChecklistItem, { ...mockChecklistItem, id: 'item-2', item: 'Wall cladding' }];
      vi.mocked(repository.bulkCreate).mockResolvedValue(items);

      const result = await service.bulkCreate([
        { inspectionId: 'insp-1', category: 'EXTERIOR', item: 'Roof cladding', decision: 'PASS' },
        { inspectionId: 'insp-1', category: 'EXTERIOR', item: 'Wall cladding', decision: 'PASS' },
      ]);

      expect(result).toHaveLength(2);
    });
  });

  describe('getSummary', () => {
    it('should calculate summary correctly', async () => {
      const items: ChecklistItem[] = [
        { ...mockChecklistItem, id: 'item-1', decision: 'PASS' },
        { ...mockChecklistItem, id: 'item-2', decision: 'PASS' },
        { ...mockChecklistItem, id: 'item-3', decision: 'FAIL', notes: 'Issue found' },
        { ...mockChecklistItem, id: 'item-4', decision: 'NA' },
      ];
      vi.mocked(repository.findByInspectionId).mockResolvedValue(items);

      const summary = await service.getSummary('insp-1');

      expect(summary.total).toBe(4);
      expect(summary.passed).toBe(2);
      expect(summary.failed).toBe(1);
      expect(summary.na).toBe(1);
      expect(summary.overallResult).toBe('FAIL');
      expect(summary.failedItemsWithoutNotes).toHaveLength(0);
    });

    it('should return PASS when all items pass or NA', async () => {
      const items: ChecklistItem[] = [
        { ...mockChecklistItem, id: 'item-1', decision: 'PASS' },
        { ...mockChecklistItem, id: 'item-2', decision: 'PASS' },
        { ...mockChecklistItem, id: 'item-3', decision: 'NA' },
      ];
      vi.mocked(repository.findByInspectionId).mockResolvedValue(items);

      const summary = await service.getSummary('insp-1');

      expect(summary.overallResult).toBe('PASS');
    });

    it('should track failed items without notes', async () => {
      const items: ChecklistItem[] = [
        { ...mockChecklistItem, id: 'item-1', decision: 'FAIL', notes: null },
        { ...mockChecklistItem, id: 'item-2', decision: 'FAIL', notes: '' },
        { ...mockChecklistItem, id: 'item-3', decision: 'FAIL', notes: 'Has notes' },
      ];
      vi.mocked(repository.findByInspectionId).mockResolvedValue(items);

      const summary = await service.getSummary('insp-1');

      expect(summary.failedItemsWithoutNotes).toContain('item-1');
      expect(summary.failedItemsWithoutNotes).toContain('item-2');
      expect(summary.failedItemsWithoutNotes).not.toContain('item-3');
    });

    it('should return INCOMPLETE when no items', async () => {
      vi.mocked(repository.findByInspectionId).mockResolvedValue([]);

      const summary = await service.getSummary('insp-1');

      expect(summary.overallResult).toBe('INCOMPLETE');
    });

    it('should group by category', async () => {
      const items: ChecklistItem[] = [
        { ...mockChecklistItem, id: 'item-1', category: 'EXTERIOR', decision: 'PASS' },
        { ...mockChecklistItem, id: 'item-2', category: 'EXTERIOR', decision: 'FAIL', notes: 'Issue' },
        { ...mockChecklistItem, id: 'item-3', category: 'INTERIOR', decision: 'PASS' },
      ];
      vi.mocked(repository.findByInspectionId).mockResolvedValue(items);

      const summary = await service.getSummary('insp-1');

      expect(summary.byCategory['EXTERIOR']).toEqual({ passed: 1, failed: 1, na: 0 });
      expect(summary.byCategory['INTERIOR']).toEqual({ passed: 1, failed: 0, na: 0 });
    });
  });

  describe('getGroupedByCategory', () => {
    it('should group items by category', async () => {
      const items: ChecklistItem[] = [
        { ...mockChecklistItem, id: 'item-1', category: 'EXTERIOR' },
        { ...mockChecklistItem, id: 'item-2', category: 'EXTERIOR' },
        { ...mockChecklistItem, id: 'item-3', category: 'INTERIOR' },
      ];
      vi.mocked(repository.findByInspectionId).mockResolvedValue(items);

      const grouped = await service.getGroupedByCategory('insp-1');

      expect(grouped['EXTERIOR']).toHaveLength(2);
      expect(grouped['INTERIOR']).toHaveLength(1);
    });
  });
});
