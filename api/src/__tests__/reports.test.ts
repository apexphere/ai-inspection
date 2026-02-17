import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ReportService,
  ReportNotFoundError,
  InspectionNotFoundError,
} from '../services/report.js';
import type { IInspectionRepository } from '../repositories/interfaces/inspection.js';
import type { Report, Inspection, Finding, Photo } from '@prisma/client';

// Mock puppeteer
vi.mock('puppeteer', () => ({
  default: {
    launch: vi.fn().mockResolvedValue({
      newPage: vi.fn().mockResolvedValue({
        setContent: vi.fn().mockResolvedValue(undefined),
        pdf: vi.fn().mockResolvedValue(Buffer.from('mock pdf')),
      }),
      close: vi.fn().mockResolvedValue(undefined),
    }),
  },
}));

// Mock fs
vi.mock('node:fs', () => ({
  existsSync: vi.fn().mockReturnValue(true),
  mkdirSync: vi.fn(),
  readFileSync: vi.fn().mockReturnValue('<html>{{address}}</html>'),
  writeFileSync: vi.fn(),
}));

vi.mock('node:fs/promises', () => ({
  access: vi.fn().mockResolvedValue(undefined),
  readFile: vi.fn().mockResolvedValue(Buffer.from('mock pdf')),
}));

// Mock repository
const createMockRepository = (): IInspectionRepository => ({
  create: vi.fn(),
  findById: vi.fn(),
  findAll: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  createFinding: vi.fn(),
  findFindingById: vi.fn(),
  findFindingsByInspection: vi.fn(),
  updateFinding: vi.fn(),
  deleteFinding: vi.fn(),
  createPhoto: vi.fn(),
  findPhotoById: vi.fn(),
  findPhotosByFinding: vi.fn(),
  deletePhoto: vi.fn(),
  createReport: vi.fn(),
  findReportById: vi.fn(),
  findReportsByInspection: vi.fn(),
});

const mockInspection: Inspection = {
  id: 'insp-1',
  address: '123 Test St',
  clientName: 'Test Client',
  inspectorName: 'Test Inspector',
  checklistId: 'nz-ppi',
  status: 'COMPLETED',
  currentSection: 'exterior',
  metadata: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  completedAt: new Date(),
};

const mockFinding: Finding = {
  id: 'find-1',
  inspectionId: 'insp-1',
  section: 'exterior',
  text: 'Crack in foundation',
  severity: 'MAJOR',
  matchedComment: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockReport: Report = {
  id: 'report-1',
  inspectionId: 'insp-1',
  format: 'pdf',
  path: '/tmp/reports/insp-1.pdf',
  createdAt: new Date(),
};

describe('ReportService', () => {
  let repository: IInspectionRepository;
  let service: ReportService;

  beforeEach(() => {
    repository = createMockRepository();
    service = new ReportService(repository, '/tmp/template.html', '/tmp/reports');
    vi.clearAllMocks();
  });

  describe('generate', () => {
    it('should generate a report for existing inspection', async () => {
      vi.mocked(repository.findById).mockResolvedValue(mockInspection);
      vi.mocked(repository.findFindingsByInspection).mockResolvedValue([mockFinding]);
      vi.mocked(repository.findPhotosByFinding).mockResolvedValue([]);
      vi.mocked(repository.createReport).mockResolvedValue(mockReport);

      const result = await service.generate('insp-1');

      expect(repository.findById).toHaveBeenCalledWith('insp-1');
      expect(repository.findFindingsByInspection).toHaveBeenCalledWith('insp-1');
      expect(repository.createReport).toHaveBeenCalled();
      expect(result).toEqual(mockReport);
    });

    it('should throw InspectionNotFoundError for non-existent inspection', async () => {
      vi.mocked(repository.findById).mockResolvedValue(null);

      await expect(service.generate('non-existent')).rejects.toThrow(
        InspectionNotFoundError
      );
    });
  });

  describe('getLatest', () => {
    it('should return the latest report', async () => {
      vi.mocked(repository.findById).mockResolvedValue(mockInspection);
      vi.mocked(repository.findReportsByInspection).mockResolvedValue([mockReport]);

      const result = await service.getLatest('insp-1');
      expect(result).toEqual(mockReport);
    });

    it('should throw InspectionNotFoundError for non-existent inspection', async () => {
      vi.mocked(repository.findById).mockResolvedValue(null);

      await expect(service.getLatest('non-existent')).rejects.toThrow(
        InspectionNotFoundError
      );
    });

    it('should throw ReportNotFoundError when no reports exist', async () => {
      vi.mocked(repository.findById).mockResolvedValue(mockInspection);
      vi.mocked(repository.findReportsByInspection).mockResolvedValue([]);

      await expect(service.getLatest('insp-1')).rejects.toThrow(
        ReportNotFoundError
      );
    });
  });

  describe('findById', () => {
    it('should return report by id', async () => {
      vi.mocked(repository.findReportById).mockResolvedValue(mockReport);

      const result = await service.findById('report-1');
      expect(result).toEqual(mockReport);
    });

    it('should throw ReportNotFoundError for non-existent report', async () => {
      vi.mocked(repository.findReportById).mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(
        ReportNotFoundError
      );
    });
  });

  describe('getFilePath', () => {
    it('should return file path for latest report', async () => {
      vi.mocked(repository.findById).mockResolvedValue(mockInspection);
      vi.mocked(repository.findReportsByInspection).mockResolvedValue([mockReport]);

      const result = await service.getFilePath('insp-1');
      expect(result).toBe(mockReport.path);
    });

    it('should throw when no report exists', async () => {
      vi.mocked(repository.findById).mockResolvedValue(mockInspection);
      vi.mocked(repository.findReportsByInspection).mockResolvedValue([]);

      await expect(service.getFilePath('insp-1')).rejects.toThrow(
        ReportNotFoundError
      );
    });
  });
});
