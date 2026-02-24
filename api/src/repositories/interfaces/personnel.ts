import type { Personnel, PersonnelRole } from '@prisma/client';

export interface CreatePersonnelInput {
  name: string;
  email: string;
  phone?: string;
  mobile?: string;
  role: PersonnelRole;
  companyId?: string;
}

export interface UpdatePersonnelInput {
  name?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  role?: PersonnelRole;
  active?: boolean;
  companyId?: string | null;
}

export interface PersonnelSearchParams {
  role?: PersonnelRole;
  active?: boolean;
  name?: string;
}

export interface IPersonnelRepository {
  create(input: CreatePersonnelInput): Promise<Personnel>;
  findById(id: string): Promise<Personnel | null>;
  findAll(params?: PersonnelSearchParams): Promise<Personnel[]>;
  findByEmail(email: string): Promise<Personnel | null>;
  update(id: string, input: UpdatePersonnelInput): Promise<Personnel>;
}
