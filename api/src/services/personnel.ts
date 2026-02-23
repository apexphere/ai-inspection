import type {
  IPersonnelRepository,
  CreatePersonnelInput,
  UpdatePersonnelInput,
  PersonnelSearchParams,
} from '../repositories/interfaces/personnel.js';
import type { Personnel } from '@prisma/client';

export class PersonnelNotFoundError extends Error {
  constructor(id: string) {
    super(`Personnel not found: ${id}`);
    this.name = 'PersonnelNotFoundError';
  }
}

export class PersonnelEmailConflictError extends Error {
  constructor(email: string) {
    super(`Personnel with email already exists: ${email}`);
    this.name = 'PersonnelEmailConflictError';
  }
}

export class PersonnelService {
  constructor(private repository: IPersonnelRepository) {}

  async create(input: CreatePersonnelInput): Promise<Personnel> {
    // Check for email uniqueness
    const existing = await this.repository.findByEmail(input.email);
    if (existing) {
      throw new PersonnelEmailConflictError(input.email);
    }
    return this.repository.create(input);
  }

  async findAll(params?: PersonnelSearchParams): Promise<Personnel[]> {
    return this.repository.findAll(params);
  }

  async findById(id: string): Promise<Personnel> {
    const personnel = await this.repository.findById(id);
    if (!personnel) {
      throw new PersonnelNotFoundError(id);
    }
    return personnel;
  }

  async update(id: string, input: UpdatePersonnelInput): Promise<Personnel> {
    await this.findById(id);

    // If email is being changed, check uniqueness
    if (input.email) {
      const existing = await this.repository.findByEmail(input.email);
      if (existing && existing.id !== id) {
        throw new PersonnelEmailConflictError(input.email);
      }
    }

    return this.repository.update(id, input);
  }

  async deactivate(id: string): Promise<Personnel> {
    await this.findById(id);
    return this.repository.update(id, { active: false });
  }
}
