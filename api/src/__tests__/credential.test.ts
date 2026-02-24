import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  CredentialService,
  CredentialNotFoundError,
  PersonnelNotFoundError,
  InvalidLBPLicenseError,
} from '../services/credential.js';
import type { ICredentialRepository } from '../repositories/interfaces/credential.js';
import type { Credential, PrismaClient, Personnel } from '@prisma/client';

// Mock repository
const createMockRepository = (): ICredentialRepository => ({
  create: vi.fn(),
  findById: vi.fn(),
  findByPersonnelId: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
});

// Mock Prisma client with personnel.findUnique
const createMockPrisma = (): { personnel: { findUnique: ReturnType<typeof vi.fn> } } => ({
  personnel: {
    findUnique: vi.fn(),
  },
});

const mockPersonnel: Personnel = {
  id: 'personnel-1',
  name: 'John Smith',
  email: 'john@example.com',
  phone: null,
  mobile: null,
  role: 'BUILDING_SURVEYOR',
  active: true,
  companyId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockCredential: Credential = {
  id: 'cred-1',
  personnelId: 'personnel-1',
  credentialType: 'NZIBS',
  membershipCode: 'MNZIBS',
  membershipFull: null,
  registrationTitle: null,
  licenseNumber: null,
  qualifications: ['BE (Hons)'],
  issuedDate: new Date('2025-01-15'),
  expiryDate: new Date('2027-01-15'),
  verified: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('CredentialService', () => {
  let repository: ICredentialRepository;
  let mockPrisma: ReturnType<typeof createMockPrisma>;
  let service: CredentialService;

  beforeEach(() => {
    repository = createMockRepository();
    mockPrisma = createMockPrisma();
    service = new CredentialService(repository, mockPrisma as unknown as PrismaClient);
  });

  describe('create', () => {
    it('should create a credential with valid input', async () => {
      mockPrisma.personnel.findUnique.mockResolvedValue(mockPersonnel);
      vi.mocked(repository.create).mockResolvedValue(mockCredential);

      const result = await service.create({
        personnelId: 'personnel-1',
        credentialType: 'NZIBS',
        membershipCode: 'MNZIBS',
        qualifications: ['BE (Hons)'],
      });

      expect(mockPrisma.personnel.findUnique).toHaveBeenCalledWith({
        where: { id: 'personnel-1' },
      });
      expect(repository.create).toHaveBeenCalledWith({
        personnelId: 'personnel-1',
        credentialType: 'NZIBS',
        membershipCode: 'MNZIBS',
        qualifications: ['BE (Hons)'],
      });
      expect(result).toEqual(mockCredential);
    });

    it('should throw PersonnelNotFoundError for non-existent personnel', async () => {
      mockPrisma.personnel.findUnique.mockResolvedValue(null);

      await expect(
        service.create({
          personnelId: 'non-existent',
          credentialType: 'NZIBS',
        })
      ).rejects.toThrow(PersonnelNotFoundError);
    });

    it('should create LBP credential with valid license number', async () => {
      const lbpCredential = {
        ...mockCredential,
        credentialType: 'LBP' as const,
        licenseNumber: 'BP123456',
      };
      mockPrisma.personnel.findUnique.mockResolvedValue(mockPersonnel);
      vi.mocked(repository.create).mockResolvedValue(lbpCredential);

      const result = await service.create({
        personnelId: 'personnel-1',
        credentialType: 'LBP',
        licenseNumber: 'BP123456',
      });

      expect(result.licenseNumber).toBe('BP123456');
    });

    it('should throw InvalidLBPLicenseError for invalid LBP license format', async () => {
      mockPrisma.personnel.findUnique.mockResolvedValue(mockPersonnel);

      await expect(
        service.create({
          personnelId: 'personnel-1',
          credentialType: 'LBP',
          licenseNumber: 'INVALID123',
        })
      ).rejects.toThrow(InvalidLBPLicenseError);
    });

    it('should throw InvalidLBPLicenseError for LBP license with wrong digit count', async () => {
      mockPrisma.personnel.findUnique.mockResolvedValue(mockPersonnel);

      await expect(
        service.create({
          personnelId: 'personnel-1',
          credentialType: 'LBP',
          licenseNumber: 'BP12345', // Only 5 digits
        })
      ).rejects.toThrow(InvalidLBPLicenseError);
    });

    it('should throw InvalidLBPLicenseError for LBP license with too many digits', async () => {
      mockPrisma.personnel.findUnique.mockResolvedValue(mockPersonnel);

      await expect(
        service.create({
          personnelId: 'personnel-1',
          credentialType: 'LBP',
          licenseNumber: 'BP1234567', // 7 digits
        })
      ).rejects.toThrow(InvalidLBPLicenseError);
    });

    it('should allow non-LBP credential without validating license format', async () => {
      const otherCredential = {
        ...mockCredential,
        credentialType: 'OTHER' as const,
        licenseNumber: 'ANY-FORMAT-123',
      };
      mockPrisma.personnel.findUnique.mockResolvedValue(mockPersonnel);
      vi.mocked(repository.create).mockResolvedValue(otherCredential);

      const result = await service.create({
        personnelId: 'personnel-1',
        credentialType: 'OTHER',
        licenseNumber: 'ANY-FORMAT-123',
      });

      expect(result.licenseNumber).toBe('ANY-FORMAT-123');
    });

    it('should allow LBP credential without license number', async () => {
      const lbpNoLicense = {
        ...mockCredential,
        credentialType: 'LBP' as const,
        licenseNumber: null,
      };
      mockPrisma.personnel.findUnique.mockResolvedValue(mockPersonnel);
      vi.mocked(repository.create).mockResolvedValue(lbpNoLicense);

      const result = await service.create({
        personnelId: 'personnel-1',
        credentialType: 'LBP',
      });

      expect(result.credentialType).toBe('LBP');
    });
  });

  describe('findById', () => {
    it('should return credential by id', async () => {
      vi.mocked(repository.findById).mockResolvedValue(mockCredential);

      const result = await service.findById('cred-1');
      expect(result).toEqual(mockCredential);
    });

    it('should throw CredentialNotFoundError for non-existent credential', async () => {
      vi.mocked(repository.findById).mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(
        CredentialNotFoundError
      );
    });
  });

  describe('findByPersonnelId', () => {
    it('should return all credentials for personnel', async () => {
      vi.mocked(repository.findByPersonnelId).mockResolvedValue([mockCredential]);

      const result = await service.findByPersonnelId('personnel-1');
      expect(result).toEqual([mockCredential]);
    });

    it('should return empty array when no credentials', async () => {
      vi.mocked(repository.findByPersonnelId).mockResolvedValue([]);

      const result = await service.findByPersonnelId('personnel-1');
      expect(result).toEqual([]);
    });
  });

  describe('update', () => {
    it('should update credential', async () => {
      const updatedCred = { ...mockCredential, verified: true };
      vi.mocked(repository.findById).mockResolvedValue(mockCredential);
      vi.mocked(repository.update).mockResolvedValue(updatedCred);

      const result = await service.update('cred-1', { verified: true });
      expect(result.verified).toBe(true);
    });

    it('should throw CredentialNotFoundError for non-existent credential', async () => {
      vi.mocked(repository.findById).mockResolvedValue(null);

      await expect(
        service.update('non-existent', { verified: true })
      ).rejects.toThrow(CredentialNotFoundError);
    });

    it('should validate LBP license when updating license number on LBP credential', async () => {
      const lbpCredential = { ...mockCredential, credentialType: 'LBP' as const };
      vi.mocked(repository.findById).mockResolvedValue(lbpCredential);

      await expect(
        service.update('cred-1', { licenseNumber: 'INVALID' })
      ).rejects.toThrow(InvalidLBPLicenseError);
    });

    it('should validate LBP license when changing credential type to LBP', async () => {
      const otherCredential = {
        ...mockCredential,
        credentialType: 'OTHER' as const,
        licenseNumber: 'INVALID',
      };
      vi.mocked(repository.findById).mockResolvedValue(otherCredential);

      await expect(
        service.update('cred-1', { credentialType: 'LBP' })
      ).rejects.toThrow(InvalidLBPLicenseError);
    });

    it('should allow valid LBP license update', async () => {
      const lbpCredential = { ...mockCredential, credentialType: 'LBP' as const };
      const updatedCred = { ...lbpCredential, licenseNumber: 'BP654321' };
      vi.mocked(repository.findById).mockResolvedValue(lbpCredential);
      vi.mocked(repository.update).mockResolvedValue(updatedCred);

      const result = await service.update('cred-1', { licenseNumber: 'BP654321' });
      expect(result.licenseNumber).toBe('BP654321');
    });

    it('should allow clearing license number on LBP credential', async () => {
      const lbpCredential = {
        ...mockCredential,
        credentialType: 'LBP' as const,
        licenseNumber: 'BP123456',
      };
      const updatedCred = { ...lbpCredential, licenseNumber: null };
      vi.mocked(repository.findById).mockResolvedValue(lbpCredential);
      vi.mocked(repository.update).mockResolvedValue(updatedCred);

      const result = await service.update('cred-1', { licenseNumber: null });
      expect(result.licenseNumber).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete existing credential', async () => {
      vi.mocked(repository.findById).mockResolvedValue(mockCredential);
      vi.mocked(repository.delete).mockResolvedValue();

      await expect(service.delete('cred-1')).resolves.toBeUndefined();
      expect(repository.delete).toHaveBeenCalledWith('cred-1');
    });

    it('should throw CredentialNotFoundError for non-existent credential', async () => {
      vi.mocked(repository.findById).mockResolvedValue(null);

      await expect(service.delete('non-existent')).rejects.toThrow(
        CredentialNotFoundError
      );
    });
  });
});
