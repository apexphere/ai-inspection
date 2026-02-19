import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  DocumentService,
  DocumentNotFoundError,
} from '../services/document.js';
import type { IDocumentRepository } from '../repositories/interfaces/document.js';
import type { Document } from '@prisma/client';

// Mock repository
const createMockRepository = (): IDocumentRepository => ({
  create: vi.fn(),
  findById: vi.fn(),
  findByProjectId: vi.fn(),
  findAll: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  getNextAppendixLetter: vi.fn(),
  reorder: vi.fn(),
});

const mockDocument: Document = {
  id: 'doc-1',
  projectId: 'proj-1',
  appendixLetter: 'A',
  filePath: '/documents/proj-1/doc-1.pdf',
  filename: 'PS3-Plumbing.pdf',
  documentType: 'PS3',
  description: 'Producer Statement for plumbing work',
  issuer: 'ABC Plumbing Ltd',
  issuedAt: new Date('2026-01-15'),
  referenceNumber: 'PS3-2026-001',
  status: 'RECEIVED',
  verified: false,
  linkedClauses: ['G12', 'G13'],
  sortOrder: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('DocumentService', () => {
  let repository: IDocumentRepository;
  let service: DocumentService;

  beforeEach(() => {
    repository = createMockRepository();
    service = new DocumentService(repository);
  });

  describe('create', () => {
    it('should create a document with auto-linked clauses', async () => {
      vi.mocked(repository.create).mockResolvedValue(mockDocument);

      const result = await service.create({
        projectId: 'proj-1',
        filePath: '/documents/proj-1/doc-1.pdf',
        filename: 'PS3-Plumbing.pdf',
        documentType: 'PS3',
        description: 'Producer Statement for plumbing work',
      });

      expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({
        linkedClauses: expect.arrayContaining(['B1', 'E2', 'E3', 'G12', 'G13']),
        status: 'RECEIVED',
      }));
      expect(result).toEqual(mockDocument);
    });

    it('should create a document with custom linked clauses', async () => {
      vi.mocked(repository.create).mockResolvedValue(mockDocument);

      await service.create({
        projectId: 'proj-1',
        filePath: '/documents/proj-1/doc-1.pdf',
        filename: 'custom.pdf',
        documentType: 'OTHER',
        description: 'Custom document',
        linkedClauses: ['B1', 'B2'],
      });

      expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({
        linkedClauses: ['B1', 'B2'],
      }));
    });

    it('should auto-link COC to G9', async () => {
      const cocDocument = { ...mockDocument, documentType: 'COC' as const, linkedClauses: ['G9'] };
      vi.mocked(repository.create).mockResolvedValue(cocDocument);

      await service.create({
        projectId: 'proj-1',
        filePath: '/documents/proj-1/coc.pdf',
        filename: 'COC.pdf',
        documentType: 'COC',
        description: 'Electrical Certificate',
      });

      expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({
        linkedClauses: ['G9'],
      }));
    });
  });

  describe('findById', () => {
    it('should return document by id', async () => {
      vi.mocked(repository.findById).mockResolvedValue(mockDocument);

      const result = await service.findById('doc-1');
      expect(result).toEqual(mockDocument);
    });

    it('should throw DocumentNotFoundError for non-existent document', async () => {
      vi.mocked(repository.findById).mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(
        DocumentNotFoundError
      );
    });
  });

  describe('findByProjectId', () => {
    it('should return all documents for project', async () => {
      vi.mocked(repository.findByProjectId).mockResolvedValue([mockDocument]);

      const result = await service.findByProjectId('proj-1');
      expect(result).toEqual([mockDocument]);
    });
  });

  describe('update', () => {
    it('should update document', async () => {
      const updatedDoc = { ...mockDocument, verified: true };
      vi.mocked(repository.findById).mockResolvedValue(mockDocument);
      vi.mocked(repository.update).mockResolvedValue(updatedDoc);

      const result = await service.update('doc-1', { verified: true });
      expect(result.verified).toBe(true);
    });

    it('should throw DocumentNotFoundError for non-existent document', async () => {
      vi.mocked(repository.findById).mockResolvedValue(null);

      await expect(
        service.update('non-existent', { verified: true })
      ).rejects.toThrow(DocumentNotFoundError);
    });
  });

  describe('delete', () => {
    it('should delete existing document', async () => {
      vi.mocked(repository.findById).mockResolvedValue(mockDocument);
      vi.mocked(repository.delete).mockResolvedValue();

      await expect(service.delete('doc-1')).resolves.toBeUndefined();
      expect(repository.delete).toHaveBeenCalledWith('doc-1');
    });

    it('should throw DocumentNotFoundError for non-existent document', async () => {
      vi.mocked(repository.findById).mockResolvedValue(null);

      await expect(service.delete('non-existent')).rejects.toThrow(
        DocumentNotFoundError
      );
    });
  });

  describe('markAsReceived', () => {
    it('should update status to RECEIVED', async () => {
      const receivedDoc = { ...mockDocument, status: 'RECEIVED' as const };
      vi.mocked(repository.findById).mockResolvedValue(mockDocument);
      vi.mocked(repository.update).mockResolvedValue(receivedDoc);

      const result = await service.markAsReceived('doc-1');
      expect(result.status).toBe('RECEIVED');
    });
  });

  describe('markAsOutstanding', () => {
    it('should update status to OUTSTANDING', async () => {
      const outstandingDoc = { ...mockDocument, status: 'OUTSTANDING' as const };
      vi.mocked(repository.findById).mockResolvedValue(mockDocument);
      vi.mocked(repository.update).mockResolvedValue(outstandingDoc);

      const result = await service.markAsOutstanding('doc-1');
      expect(result.status).toBe('OUTSTANDING');
    });
  });

  describe('markAsNA', () => {
    it('should update status to NA', async () => {
      const naDoc = { ...mockDocument, status: 'NA' as const };
      vi.mocked(repository.findById).mockResolvedValue(mockDocument);
      vi.mocked(repository.update).mockResolvedValue(naDoc);

      const result = await service.markAsNA('doc-1');
      expect(result.status).toBe('NA');
    });
  });

  describe('verify', () => {
    it('should mark document as verified', async () => {
      const verifiedDoc = { ...mockDocument, verified: true };
      vi.mocked(repository.findById).mockResolvedValue(mockDocument);
      vi.mocked(repository.update).mockResolvedValue(verifiedDoc);

      const result = await service.verify('doc-1', true);
      expect(result.verified).toBe(true);
    });

    it('should mark document as unverified', async () => {
      const unverifiedDoc = { ...mockDocument, verified: false };
      vi.mocked(repository.findById).mockResolvedValue({ ...mockDocument, verified: true });
      vi.mocked(repository.update).mockResolvedValue(unverifiedDoc);

      const result = await service.verify('doc-1', false);
      expect(result.verified).toBe(false);
    });
  });

  describe('linkClauses', () => {
    it('should update linked clauses', async () => {
      const linkedDoc = { ...mockDocument, linkedClauses: ['B1', 'B2', 'E2'] };
      vi.mocked(repository.findById).mockResolvedValue(mockDocument);
      vi.mocked(repository.update).mockResolvedValue(linkedDoc);

      const result = await service.linkClauses('doc-1', ['B1', 'B2', 'E2']);
      expect(result.linkedClauses).toEqual(['B1', 'B2', 'E2']);
    });
  });

  describe('getSummary', () => {
    it('should calculate summary correctly', async () => {
      const documents: Document[] = [
        { ...mockDocument, id: 'doc-1', status: 'RECEIVED', documentType: 'PS3' },
        { ...mockDocument, id: 'doc-2', status: 'RECEIVED', documentType: 'COC' },
        { ...mockDocument, id: 'doc-3', status: 'OUTSTANDING', documentType: 'WARRANTY' },
        { ...mockDocument, id: 'doc-4', status: 'NA', documentType: 'INVOICE' },
      ];
      vi.mocked(repository.findByProjectId).mockResolvedValue(documents);

      const summary = await service.getSummary('proj-1');

      expect(summary.total).toBe(4);
      expect(summary.byStatus.RECEIVED).toBe(2);
      expect(summary.byStatus.OUTSTANDING).toBe(1);
      expect(summary.byStatus.NA).toBe(1);
      expect(summary.received).toBe(2);
      expect(summary.outstanding).toBe(1);
    });

    it('should calculate completion percentage', async () => {
      const documents: Document[] = [
        { ...mockDocument, id: 'doc-1', status: 'RECEIVED' },
        { ...mockDocument, id: 'doc-2', status: 'RECEIVED' },
        { ...mockDocument, id: 'doc-3', status: 'OUTSTANDING' },
        { ...mockDocument, id: 'doc-4', status: 'REQUIRED' },
      ];
      vi.mocked(repository.findByProjectId).mockResolvedValue(documents);

      const summary = await service.getSummary('proj-1');

      // 2 received out of 4 required = 50%
      expect(summary.completionPercentage).toBe(50);
    });

    it('should return 100% when no required documents', async () => {
      const documents: Document[] = [
        { ...mockDocument, id: 'doc-1', status: 'NA' },
      ];
      vi.mocked(repository.findByProjectId).mockResolvedValue(documents);

      const summary = await service.getSummary('proj-1');

      expect(summary.completionPercentage).toBe(100);
    });
  });

  describe('canFinalize', () => {
    it('should return true when no outstanding/required documents', async () => {
      vi.mocked(repository.findAll)
        .mockResolvedValueOnce([]) // outstanding
        .mockResolvedValueOnce([]); // required

      const result = await service.canFinalize('proj-1');

      expect(result.canFinalize).toBe(true);
      expect(result.blockers).toHaveLength(0);
    });

    it('should return false with blockers when documents outstanding', async () => {
      const outstandingDoc = { ...mockDocument, status: 'OUTSTANDING' as const };
      vi.mocked(repository.findAll)
        .mockResolvedValueOnce([outstandingDoc]) // outstanding
        .mockResolvedValueOnce([]); // required

      const result = await service.canFinalize('proj-1');

      expect(result.canFinalize).toBe(false);
      expect(result.blockers).toContain('PS3: Producer Statement for plumbing work (OUTSTANDING)');
    });

    it('should return false with blockers when documents required', async () => {
      const requiredDoc = { ...mockDocument, status: 'REQUIRED' as const };
      vi.mocked(repository.findAll)
        .mockResolvedValueOnce([]) // outstanding
        .mockResolvedValueOnce([requiredDoc]); // required

      const result = await service.canFinalize('proj-1');

      expect(result.canFinalize).toBe(false);
      expect(result.blockers.length).toBeGreaterThan(0);
    });
  });

  describe('reorder', () => {
    it('should call repository reorder', async () => {
      vi.mocked(repository.reorder).mockResolvedValue();

      await service.reorder('proj-1', ['doc-2', 'doc-1', 'doc-3']);

      expect(repository.reorder).toHaveBeenCalledWith('proj-1', ['doc-2', 'doc-1', 'doc-3']);
    });
  });
});
