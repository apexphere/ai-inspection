import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CompanyService } from '../services/company.js';
import type { Company } from '@prisma/client';

// Mock the repository module
vi.mock('../repositories/prisma/company.js', () => ({
  createCompany: vi.fn(),
  getCompanyById: vi.fn(),
  listCompanies: vi.fn(),
  updateCompany: vi.fn(),
  deleteCompany: vi.fn(),
}));

import {
  createCompany,
  getCompanyById,
  listCompanies,
  updateCompany,
  deleteCompany,
} from '../repositories/prisma/company.js';

const mockCreate = vi.mocked(createCompany);
const mockGetById = vi.mocked(getCompanyById);
const mockList = vi.mocked(listCompanies);
const mockUpdate = vi.mocked(updateCompany);
const mockDelete = vi.mocked(deleteCompany);

const mockCompany: Company = {
  id: 'company-1',
  name: 'Acme Inspections Ltd',
  address: '123 Main St',
  phone: '+64 21 555 0100',
  email: 'info@acme.co.nz',
  website: 'https://acme.co.nz',
  logoPath: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

describe('CompanyService', () => {
  let service: CompanyService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CompanyService();
  });

  describe('create', () => {
    it('should create a company with valid input', async () => {
      mockCreate.mockResolvedValue(mockCompany);

      const result = await service.create({
        name: 'Acme Inspections Ltd',
        address: '123 Main St',
        phone: '+64 21 555 0100',
        email: 'info@acme.co.nz',
        website: 'https://acme.co.nz',
      });

      expect(result).toEqual(mockCompany);
      expect(mockCreate).toHaveBeenCalledWith({
        name: 'Acme Inspections Ltd',
        address: '123 Main St',
        phone: '+64 21 555 0100',
        email: 'info@acme.co.nz',
        website: 'https://acme.co.nz',
      });
    });

    it('should create a company with only required fields', async () => {
      const minimalCompany = { ...mockCompany, address: null, phone: null, email: null, website: null };
      mockCreate.mockResolvedValue(minimalCompany);

      const result = await service.create({ name: 'Minimal Co' });

      expect(result).toEqual(minimalCompany);
      expect(mockCreate).toHaveBeenCalledWith({ name: 'Minimal Co' });
    });

    it('should propagate repository errors', async () => {
      mockCreate.mockRejectedValue(new Error('Unique constraint failed'));

      await expect(service.create({ name: 'Duplicate Co' })).rejects.toThrow(
        'Unique constraint failed',
      );
    });
  });

  describe('getById', () => {
    it('should return a company when found', async () => {
      mockGetById.mockResolvedValue(mockCompany);

      const result = await service.getById('company-1');

      expect(result).toEqual(mockCompany);
      expect(mockGetById).toHaveBeenCalledWith('company-1');
    });

    it('should throw when company not found', async () => {
      mockGetById.mockResolvedValue(null);

      await expect(service.getById('nonexistent')).rejects.toThrow('Company not found');
    });
  });

  describe('list', () => {
    it('should return all companies', async () => {
      const companies = [mockCompany, { ...mockCompany, id: 'company-2', name: 'Beta Corp' }];
      mockList.mockResolvedValue(companies);

      const result = await service.list();

      expect(result).toEqual(companies);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no companies exist', async () => {
      mockList.mockResolvedValue([]);

      const result = await service.list();

      expect(result).toEqual([]);
    });
  });

  describe('update', () => {
    it('should update a company when it exists', async () => {
      const updated = { ...mockCompany, name: 'Updated Name' };
      mockGetById.mockResolvedValue(mockCompany);
      mockUpdate.mockResolvedValue(updated);

      const result = await service.update('company-1', { name: 'Updated Name' });

      expect(result).toEqual(updated);
      expect(mockGetById).toHaveBeenCalledWith('company-1');
      expect(mockUpdate).toHaveBeenCalledWith('company-1', { name: 'Updated Name' });
    });

    it('should throw when company not found', async () => {
      mockGetById.mockResolvedValue(null);

      await expect(service.update('nonexistent', { name: 'New' })).rejects.toThrow(
        'Company not found',
      );
      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete a company when it exists', async () => {
      mockGetById.mockResolvedValue(mockCompany);
      mockDelete.mockResolvedValue(mockCompany);

      await service.delete('company-1');

      expect(mockGetById).toHaveBeenCalledWith('company-1');
      expect(mockDelete).toHaveBeenCalledWith('company-1');
    });

    it('should throw when company not found', async () => {
      mockGetById.mockResolvedValue(null);

      await expect(service.delete('nonexistent')).rejects.toThrow('Company not found');
      expect(mockDelete).not.toHaveBeenCalled();
    });

    it('should propagate foreign key constraint errors', async () => {
      mockGetById.mockResolvedValue(mockCompany);
      mockDelete.mockRejectedValue(new Error('Foreign key constraint failed'));

      await expect(service.delete('company-1')).rejects.toThrow(
        'Foreign key constraint failed',
      );
    });
  });

  describe('updateLogo', () => {
    it('should update logo path when company exists', async () => {
      const withLogo = { ...mockCompany, logoPath: '/uploads/logo.png' };
      mockGetById.mockResolvedValue(mockCompany);
      mockUpdate.mockResolvedValue(withLogo);

      const result = await service.updateLogo('company-1', '/uploads/logo.png');

      expect(result).toEqual(withLogo);
      expect(mockUpdate).toHaveBeenCalledWith('company-1', { logoPath: '/uploads/logo.png' });
    });

    it('should throw when company not found', async () => {
      mockGetById.mockResolvedValue(null);

      await expect(service.updateLogo('nonexistent', '/logo.png')).rejects.toThrow(
        'Company not found',
      );
      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });
});
