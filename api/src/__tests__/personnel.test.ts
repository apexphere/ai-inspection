import { describe, it, expect, beforeEach } from 'vitest';
import type { Personnel, PersonnelRole } from '@prisma/client';
import {
  PersonnelService,
  PersonnelNotFoundError,
  PersonnelEmailConflictError,
} from '../services/personnel.js';
import type {
  IPersonnelRepository,
  CreatePersonnelInput,
  UpdatePersonnelInput,
  PersonnelSearchParams,
} from '../repositories/interfaces/personnel.js';

function createMockPersonnel(overrides: Partial<Personnel> = {}): Personnel {
  return {
    id: 'test-id-1',
    name: 'John Smith',
    email: 'john@example.com',
    phone: null,
    mobile: null,
    role: 'INSPECTOR' as PersonnelRole,
    active: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

function createMockRepository(): IPersonnelRepository {
  const store: Personnel[] = [];

  return {
    create: async (input: CreatePersonnelInput): Promise<Personnel> => {
      const personnel = createMockPersonnel({
        id: `id-${store.length + 1}`,
        ...input,
      });
      store.push(personnel);
      return personnel;
    },
    findById: async (id: string): Promise<Personnel | null> => {
      return store.find((p) => p.id === id) || null;
    },
    findAll: async (params?: PersonnelSearchParams): Promise<Personnel[]> => {
      let result = [...store];
      if (params?.role) {
        result = result.filter((p) => p.role === params.role);
      }
      if (params?.active !== undefined) {
        result = result.filter((p) => p.active === params.active);
      }
      if (params?.name) {
        result = result.filter((p) =>
          p.name.toLowerCase().includes(params.name!.toLowerCase())
        );
      }
      return result;
    },
    findByEmail: async (email: string): Promise<Personnel | null> => {
      return store.find((p) => p.email === email) || null;
    },
    update: async (id: string, input: UpdatePersonnelInput): Promise<Personnel> => {
      const index = store.findIndex((p) => p.id === id);
      if (index === -1) throw new Error('Not found');
      store[index] = { ...store[index], ...input } as Personnel;
      return store[index];
    },
  };
}

describe('PersonnelService', () => {
  let service: PersonnelService;
  let repository: IPersonnelRepository;

  beforeEach(() => {
    repository = createMockRepository();
    service = new PersonnelService(repository);
  });

  describe('create', () => {
    it('should create personnel with valid input', async () => {
      const input: CreatePersonnelInput = {
        name: 'John Smith',
        email: 'john@example.com',
        role: 'INSPECTOR' as PersonnelRole,
      };

      const result = await service.create(input);

      expect(result.name).toBe('John Smith');
      expect(result.email).toBe('john@example.com');
      expect(result.role).toBe('INSPECTOR');
      expect(result.active).toBe(true);
    });

    it('should reject duplicate email', async () => {
      const input: CreatePersonnelInput = {
        name: 'John Smith',
        email: 'john@example.com',
        role: 'INSPECTOR' as PersonnelRole,
      };

      await service.create(input);

      await expect(
        service.create({ ...input, name: 'Jane Smith' })
      ).rejects.toThrow(PersonnelEmailConflictError);
    });
  });

  describe('findById', () => {
    it('should return personnel by ID', async () => {
      const created = await service.create({
        name: 'John Smith',
        email: 'john@example.com',
        role: 'INSPECTOR' as PersonnelRole,
      });

      const found = await service.findById(created.id);
      expect(found.email).toBe('john@example.com');
    });

    it('should throw PersonnelNotFoundError for unknown ID', async () => {
      await expect(service.findById('nonexistent')).rejects.toThrow(
        PersonnelNotFoundError
      );
    });
  });

  describe('findAll', () => {
    it('should filter by role', async () => {
      await service.create({
        name: 'Inspector A',
        email: 'a@example.com',
        role: 'INSPECTOR' as PersonnelRole,
      });
      await service.create({
        name: 'Admin B',
        email: 'b@example.com',
        role: 'ADMIN' as PersonnelRole,
      });

      const inspectors = await service.findAll({ role: 'INSPECTOR' as PersonnelRole });
      expect(inspectors).toHaveLength(1);
      expect(inspectors[0].name).toBe('Inspector A');
    });

    it('should filter by active status', async () => {
      const created = await service.create({
        name: 'John Smith',
        email: 'john@example.com',
        role: 'INSPECTOR' as PersonnelRole,
      });
      await service.deactivate(created.id);

      const active = await service.findAll({ active: true });
      expect(active).toHaveLength(0);

      const inactive = await service.findAll({ active: false });
      expect(inactive).toHaveLength(1);
    });
  });

  describe('update', () => {
    it('should update personnel details', async () => {
      const created = await service.create({
        name: 'John Smith',
        email: 'john@example.com',
        role: 'INSPECTOR' as PersonnelRole,
      });

      const updated = await service.update(created.id, {
        name: 'John Updated',
        phone: '021-123-4567',
      });

      expect(updated.name).toBe('John Updated');
      expect(updated.phone).toBe('021-123-4567');
    });

    it('should reject email change that conflicts', async () => {
      await service.create({
        name: 'Person A',
        email: 'a@example.com',
        role: 'INSPECTOR' as PersonnelRole,
      });
      const personB = await service.create({
        name: 'Person B',
        email: 'b@example.com',
        role: 'ADMIN' as PersonnelRole,
      });

      await expect(
        service.update(personB.id, { email: 'a@example.com' })
      ).rejects.toThrow(PersonnelEmailConflictError);
    });
  });

  describe('deactivate', () => {
    it('should soft delete by setting active to false', async () => {
      const created = await service.create({
        name: 'John Smith',
        email: 'john@example.com',
        role: 'INSPECTOR' as PersonnelRole,
      });

      const deactivated = await service.deactivate(created.id);
      expect(deactivated.active).toBe(false);
    });

    it('should throw for unknown personnel', async () => {
      await expect(service.deactivate('nonexistent')).rejects.toThrow(
        PersonnelNotFoundError
      );
    });
  });
});
