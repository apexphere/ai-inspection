import type { Credential, PrismaClient } from '@prisma/client';
import type {
  ICredentialRepository,
  CreateCredentialInput,
  UpdateCredentialInput,
} from '../repositories/interfaces/credential.js';

export class CredentialNotFoundError extends Error {
  constructor(id: string) {
    super(`Credential not found: ${id}`);
    this.name = 'CredentialNotFoundError';
  }
}

export class PersonnelNotFoundError extends Error {
  constructor(id: string) {
    super(`Personnel not found: ${id}`);
    this.name = 'PersonnelNotFoundError';
  }
}

export class InvalidLBPLicenseError extends Error {
  constructor(licenseNumber: string) {
    super(`Invalid LBP license number format: ${licenseNumber}. Must be BP followed by exactly 6 digits (e.g., BP123456)`);
    this.name = 'InvalidLBPLicenseError';
  }
}

// LBP license number format: BP followed by exactly 6 digits
const LBP_LICENSE_PATTERN = /^BP\d{6}$/;

function validateLBPLicense(licenseNumber: string): boolean {
  return LBP_LICENSE_PATTERN.test(licenseNumber);
}

export class CredentialService {
  constructor(
    private repository: ICredentialRepository,
    private prisma: PrismaClient
  ) {}

  async create(input: CreateCredentialInput): Promise<Credential> {
    // Verify personnel exists
    const personnel = await this.prisma.personnel.findUnique({
      where: { id: input.personnelId },
    });
    if (!personnel) {
      throw new PersonnelNotFoundError(input.personnelId);
    }

    // Validate LBP license number format if credential type is LBP
    if (input.credentialType === 'LBP' && input.licenseNumber) {
      if (!validateLBPLicense(input.licenseNumber)) {
        throw new InvalidLBPLicenseError(input.licenseNumber);
      }
    }

    return this.repository.create(input);
  }

  async findByPersonnelId(personnelId: string): Promise<Credential[]> {
    return this.repository.findByPersonnelId(personnelId);
  }

  async findById(id: string): Promise<Credential> {
    const credential = await this.repository.findById(id);
    if (!credential) {
      throw new CredentialNotFoundError(id);
    }
    return credential;
  }

  async update(id: string, input: UpdateCredentialInput): Promise<Credential> {
    const credential = await this.findById(id);

    // Validate LBP license number format if updating to LBP type or updating license number
    const effectiveType = input.credentialType ?? credential.credentialType;
    const effectiveLicense = input.licenseNumber !== undefined ? input.licenseNumber : credential.licenseNumber;

    if (effectiveType === 'LBP' && effectiveLicense) {
      if (!validateLBPLicense(effectiveLicense)) {
        throw new InvalidLBPLicenseError(effectiveLicense);
      }
    }

    return this.repository.update(id, input);
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.repository.delete(id);
  }
}
