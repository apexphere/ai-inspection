import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { ReportAuditLog } from '@prisma/client';
import { ReportAuditLogService, ReportAuditLogNotFoundError } from '../services/report-audit-log.js';
import type { IReportAuditLogRepository } from '../repositories/interfaces/report-audit-log.js';

function createMockRepository(): IReportAuditLogRepository {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    findByReportId: vi.fn(),
    findAll: vi.fn(),
    delete: vi.fn(),
  };
}

const sampleEntry: ReportAuditLog = {
  id: 'log-1',
  reportId: 'report-1',
  action: 'CREATED',
  userId: 'user-1',
  changes: null,
  createdAt: new Date('2026-02-24T00:00:00Z'),
};

describe('ReportAuditLogService', () => {
  let service: ReportAuditLogService;
  let mockRepo: IReportAuditLogRepository;

  beforeEach(() => {
    mockRepo = createMockRepository();
    service = new ReportAuditLogService(mockRepo);
  });

  // ─── log ─────────────────────────────────────────────────────────────────

  describe('log', () => {
    it('should create an audit log entry', async () => {
      vi.mocked(mockRepo.create).mockResolvedValue(sampleEntry);

      const result = await service.log({
        reportId: 'report-1',
        action: 'CREATED',
        userId: 'user-1',
      });

      expect(result).toEqual(sampleEntry);
      expect(mockRepo.create).toHaveBeenCalledWith({
        reportId: 'report-1',
        action: 'CREATED',
        userId: 'user-1',
      });
    });

    it('should allow logging without userId', async () => {
      const entryNoUser = { ...sampleEntry, userId: null };
      vi.mocked(mockRepo.create).mockResolvedValue(entryNoUser);

      const result = await service.log({ reportId: 'report-1', action: 'CONTENT_UPDATED' });
      expect(result.userId).toBeNull();
    });
  });

  // ─── logStatusChange ──────────────────────────────────────────────────────

  describe('logStatusChange', () => {
    it('should log a status transition with from/to in changes', async () => {
      const entry = { ...sampleEntry, action: 'STATUS_CHANGED' as const, changes: { from: 'DRAFT', to: 'REVIEW' } };
      vi.mocked(mockRepo.create).mockResolvedValue(entry);

      const result = await service.logStatusChange('report-1', 'DRAFT', 'REVIEW', 'user-1');

      expect(mockRepo.create).toHaveBeenCalledWith({
        reportId: 'report-1',
        action: 'STATUS_CHANGED',
        userId: 'user-1',
        changes: { from: 'DRAFT', to: 'REVIEW' },
      });
      expect(result.action).toBe('STATUS_CHANGED');
    });
  });

  // ─── logContentUpdate ────────────────────────────────────────────────────

  describe('logContentUpdate', () => {
    it('should log a content update with field-level changes', async () => {
      const changes = { path: { from: '/old.pdf', to: '/new.pdf' } };
      const entry = { ...sampleEntry, action: 'CONTENT_UPDATED' as const, changes };
      vi.mocked(mockRepo.create).mockResolvedValue(entry);

      const result = await service.logContentUpdate('report-1', changes, 'user-1');

      expect(mockRepo.create).toHaveBeenCalledWith({
        reportId: 'report-1',
        action: 'CONTENT_UPDATED',
        userId: 'user-1',
        changes,
      });
      expect(result.action).toBe('CONTENT_UPDATED');
    });
  });

  // ─── logVersionCreated ───────────────────────────────────────────────────

  describe('logVersionCreated', () => {
    it('should log version creation with version number in changes', async () => {
      const entry = { ...sampleEntry, action: 'VERSION_CREATED' as const, changes: { version: 2 } };
      vi.mocked(mockRepo.create).mockResolvedValue(entry);

      const result = await service.logVersionCreated('report-1', 2, 'user-1');

      expect(mockRepo.create).toHaveBeenCalledWith({
        reportId: 'report-1',
        action: 'VERSION_CREATED',
        userId: 'user-1',
        changes: { version: 2 },
      });
      expect(result.action).toBe('VERSION_CREATED');
    });
  });

  // ─── getHistory ───────────────────────────────────────────────────────────

  describe('getHistory', () => {
    it('should return all audit entries for a report ordered newest first', async () => {
      const entries = [
        { ...sampleEntry, id: 'log-2', action: 'STATUS_CHANGED' as const },
        sampleEntry,
      ];
      vi.mocked(mockRepo.findByReportId).mockResolvedValue(entries);

      const result = await service.getHistory('report-1');

      expect(result).toHaveLength(2);
      expect(mockRepo.findByReportId).toHaveBeenCalledWith('report-1');
    });

    it('should return empty array when no audit entries exist', async () => {
      vi.mocked(mockRepo.findByReportId).mockResolvedValue([]);

      const result = await service.getHistory('report-99');

      expect(result).toEqual([]);
    });
  });

  // ─── findById ────────────────────────────────────────────────────────────

  describe('findById', () => {
    it('should return a specific audit entry', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(sampleEntry);

      const result = await service.findById('log-1');
      expect(result).toEqual(sampleEntry);
    });

    it('should throw ReportAuditLogNotFoundError for unknown id', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(ReportAuditLogNotFoundError);
    });
  });

  // ─── findAll ──────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('should return all entries without filters', async () => {
      vi.mocked(mockRepo.findAll).mockResolvedValue([sampleEntry]);

      const result = await service.findAll();
      expect(result).toHaveLength(1);
      expect(mockRepo.findAll).toHaveBeenCalledWith(undefined);
    });

    it('should pass filter params to repository', async () => {
      vi.mocked(mockRepo.findAll).mockResolvedValue([]);

      await service.findAll({ action: 'STATUS_CHANGED', reportId: 'report-1' });

      expect(mockRepo.findAll).toHaveBeenCalledWith({
        action: 'STATUS_CHANGED',
        reportId: 'report-1',
      });
    });
  });

  // ─── delete ───────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('should delete an existing entry', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(sampleEntry);
      vi.mocked(mockRepo.delete).mockResolvedValue(undefined);

      await service.delete('log-1');

      expect(mockRepo.delete).toHaveBeenCalledWith('log-1');
    });

    it('should throw ReportAuditLogNotFoundError when deleting non-existent entry', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(null);

      await expect(service.delete('nonexistent')).rejects.toThrow(ReportAuditLogNotFoundError);
      expect(mockRepo.delete).not.toHaveBeenCalled();
    });
  });
});
