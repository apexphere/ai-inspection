import type { Credential, CredentialType } from '@prisma/client';

export interface CreateCredentialInput {
  personnelId: string;
  credentialType: CredentialType;
  membershipCode?: string;
  registrationTitle?: string;
  licenseNumber?: string;
  qualifications?: string[];
  issuedDate?: Date;
  expiryDate?: Date;
  verified?: boolean;
}

export interface UpdateCredentialInput {
  credentialType?: CredentialType;
  membershipCode?: string | null;
  registrationTitle?: string | null;
  licenseNumber?: string | null;
  qualifications?: string[];
  issuedDate?: Date | null;
  expiryDate?: Date | null;
  verified?: boolean;
}

export interface ICredentialRepository {
  create(input: CreateCredentialInput): Promise<Credential>;
  findById(id: string): Promise<Credential | null>;
  findByPersonnelId(personnelId: string): Promise<Credential[]>;
  update(id: string, input: UpdateCredentialInput): Promise<Credential>;
  delete(id: string): Promise<void>;
}
