import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ProjectService,
  PropertyService,
  ClientService,
  ProjectNotFoundError,
  PropertyNotFoundError,
  ClientNotFoundError,
} from '../services/project.js';
import type {
  IProjectRepository,
  IPropertyRepository,
  IClientRepository,
} from '../repositories/interfaces/project.js';
import type { Project, Property, Client } from '@prisma/client';

// Mock repositories
const createMockProjectRepository = (): IProjectRepository => ({
  create: vi.fn(),
  findById: vi.fn(),
  findByJobNumber: vi.fn(),
  findAll: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  generateJobNumber: vi.fn(),
});

const createMockPropertyRepository = (): IPropertyRepository => ({
  create: vi.fn(),
  findById: vi.fn(),
  findAll: vi.fn(),
  update: vi.fn(),
});

const createMockClientRepository = (): IClientRepository => ({
  create: vi.fn(),
  findById: vi.fn(),
  findAll: vi.fn(),
  update: vi.fn(),
});

const mockProperty: Property = {
  id: 'prop-1',
  streetAddress: '123 Test St',
  suburb: 'Henderson',
  city: 'Auckland',
  postcode: '0612',
  lotDp: 'Lot 1 DP 12345',
  councilPropertyId: null,
  territorialAuthority: 'AKL',
  bcNumber: null,
  yearBuilt: 2000,
  siteData: null,
  construction: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockClient: Client = {
  id: 'client-1',
  name: 'John Smith',
  email: 'john@example.com',
  phone: '09 123 4567',
  mobile: '021 123 4567',
  address: '456 Other St',
  contactPerson: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockProject: Project = {
  id: 'proj-1',
  jobNumber: '260219-001',
  activity: 'Bathroom renovation',
  reportType: 'COA',
  status: 'DRAFT',
  propertyId: 'prop-1',
  clientId: 'client-1',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('ProjectService', () => {
  let repository: IProjectRepository;
  let service: ProjectService;

  beforeEach(() => {
    repository = createMockProjectRepository();
    service = new ProjectService(repository);
  });

  describe('create', () => {
    it('should create a project with auto-generated job number', async () => {
      vi.mocked(repository.generateJobNumber).mockResolvedValue('260219-001');
      vi.mocked(repository.create).mockResolvedValue(mockProject);

      const result = await service.create({
        activity: 'Bathroom renovation',
        reportType: 'COA',
        propertyId: 'prop-1',
        clientId: 'client-1',
      });

      expect(repository.generateJobNumber).toHaveBeenCalled();
      expect(repository.create).toHaveBeenCalledWith({
        activity: 'Bathroom renovation',
        reportType: 'COA',
        propertyId: 'prop-1',
        clientId: 'client-1',
        jobNumber: '260219-001',
      });
      expect(result).toEqual(mockProject);
    });

    it('should create a project with manual job number', async () => {
      vi.mocked(repository.create).mockResolvedValue(mockProject);

      const result = await service.create({
        jobNumber: 'MANUAL-001',
        activity: 'Bathroom renovation',
        reportType: 'COA',
        propertyId: 'prop-1',
        clientId: 'client-1',
      });

      expect(repository.generateJobNumber).not.toHaveBeenCalled();
      expect(repository.create).toHaveBeenCalledWith({
        jobNumber: 'MANUAL-001',
        activity: 'Bathroom renovation',
        reportType: 'COA',
        propertyId: 'prop-1',
        clientId: 'client-1',
      });
      expect(result).toEqual(mockProject);
    });
  });

  describe('findById', () => {
    it('should return project by id', async () => {
      vi.mocked(repository.findById).mockResolvedValue(mockProject);

      const result = await service.findById('proj-1');
      expect(result).toEqual(mockProject);
    });

    it('should throw ProjectNotFoundError for non-existent project', async () => {
      vi.mocked(repository.findById).mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(
        ProjectNotFoundError
      );
    });
  });

  describe('findByJobNumber', () => {
    it('should return project by job number', async () => {
      vi.mocked(repository.findByJobNumber).mockResolvedValue(mockProject);

      const result = await service.findByJobNumber('260219-001');
      expect(result).toEqual(mockProject);
    });

    it('should throw ProjectNotFoundError for non-existent job number', async () => {
      vi.mocked(repository.findByJobNumber).mockResolvedValue(null);

      await expect(service.findByJobNumber('non-existent')).rejects.toThrow(
        ProjectNotFoundError
      );
    });
  });

  describe('findAll', () => {
    it('should return all projects', async () => {
      vi.mocked(repository.findAll).mockResolvedValue([mockProject]);

      const result = await service.findAll();
      expect(result).toEqual([mockProject]);
    });

    it('should filter projects by status', async () => {
      vi.mocked(repository.findAll).mockResolvedValue([mockProject]);

      await service.findAll({ status: 'DRAFT' });
      expect(repository.findAll).toHaveBeenCalledWith({ status: 'DRAFT' });
    });
  });

  describe('update', () => {
    it('should update project', async () => {
      const updatedProject = { ...mockProject, status: 'IN_PROGRESS' as const };
      vi.mocked(repository.findById).mockResolvedValue(mockProject);
      vi.mocked(repository.update).mockResolvedValue(updatedProject);

      const result = await service.update('proj-1', { status: 'IN_PROGRESS' });
      expect(result.status).toBe('IN_PROGRESS');
    });

    it('should throw ProjectNotFoundError for non-existent project', async () => {
      vi.mocked(repository.findById).mockResolvedValue(null);

      await expect(
        service.update('non-existent', { status: 'IN_PROGRESS' })
      ).rejects.toThrow(ProjectNotFoundError);
    });
  });

  describe('delete', () => {
    it('should delete existing project', async () => {
      vi.mocked(repository.findById).mockResolvedValue(mockProject);
      vi.mocked(repository.delete).mockResolvedValue();

      await expect(service.delete('proj-1')).resolves.toBeUndefined();
      expect(repository.delete).toHaveBeenCalledWith('proj-1');
    });

    it('should throw ProjectNotFoundError for non-existent project', async () => {
      vi.mocked(repository.findById).mockResolvedValue(null);

      await expect(service.delete('non-existent')).rejects.toThrow(
        ProjectNotFoundError
      );
    });
  });
});

describe('PropertyService', () => {
  let repository: IPropertyRepository;
  let service: PropertyService;

  beforeEach(() => {
    repository = createMockPropertyRepository();
    service = new PropertyService(repository);
  });

  describe('create', () => {
    it('should create a property', async () => {
      vi.mocked(repository.create).mockResolvedValue(mockProperty);

      const result = await service.create({
        streetAddress: '123 Test St',
        territorialAuthority: 'AKL',
      });

      expect(repository.create).toHaveBeenCalled();
      expect(result).toEqual(mockProperty);
    });
  });

  describe('findById', () => {
    it('should return property by id', async () => {
      vi.mocked(repository.findById).mockResolvedValue(mockProperty);

      const result = await service.findById('prop-1');
      expect(result).toEqual(mockProperty);
    });

    it('should throw PropertyNotFoundError for non-existent property', async () => {
      vi.mocked(repository.findById).mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(
        PropertyNotFoundError
      );
    });
  });

  describe('findAll', () => {
    it('should return all properties', async () => {
      vi.mocked(repository.findAll).mockResolvedValue([mockProperty]);

      const result = await service.findAll();
      expect(result).toEqual([mockProperty]);
    });

    it('should filter properties by address', async () => {
      vi.mocked(repository.findAll).mockResolvedValue([mockProperty]);

      await service.findAll({ address: 'Test' });
      expect(repository.findAll).toHaveBeenCalledWith({ address: 'Test' });
    });
  });

  describe('update', () => {
    it('should update property', async () => {
      const updatedProperty = { ...mockProperty, suburb: 'Te Atatu' };
      vi.mocked(repository.findById).mockResolvedValue(mockProperty);
      vi.mocked(repository.update).mockResolvedValue(updatedProperty);

      const result = await service.update('prop-1', { suburb: 'Te Atatu' });
      expect(result.suburb).toBe('Te Atatu');
    });

    it('should throw PropertyNotFoundError for non-existent property', async () => {
      vi.mocked(repository.findById).mockResolvedValue(null);

      await expect(
        service.update('non-existent', { suburb: 'Te Atatu' })
      ).rejects.toThrow(PropertyNotFoundError);
    });
  });
});

describe('ClientService', () => {
  let repository: IClientRepository;
  let service: ClientService;

  beforeEach(() => {
    repository = createMockClientRepository();
    service = new ClientService(repository);
  });

  describe('create', () => {
    it('should create a client', async () => {
      vi.mocked(repository.create).mockResolvedValue(mockClient);

      const result = await service.create({
        name: 'John Smith',
        email: 'john@example.com',
      });

      expect(repository.create).toHaveBeenCalled();
      expect(result).toEqual(mockClient);
    });
  });

  describe('findById', () => {
    it('should return client by id', async () => {
      vi.mocked(repository.findById).mockResolvedValue(mockClient);

      const result = await service.findById('client-1');
      expect(result).toEqual(mockClient);
    });

    it('should throw ClientNotFoundError for non-existent client', async () => {
      vi.mocked(repository.findById).mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(
        ClientNotFoundError
      );
    });
  });

  describe('findAll', () => {
    it('should return all clients', async () => {
      vi.mocked(repository.findAll).mockResolvedValue([mockClient]);

      const result = await service.findAll();
      expect(result).toEqual([mockClient]);
    });

    it('should filter clients by name', async () => {
      vi.mocked(repository.findAll).mockResolvedValue([mockClient]);

      await service.findAll({ name: 'John' });
      expect(repository.findAll).toHaveBeenCalledWith({ name: 'John' });
    });
  });

  describe('update', () => {
    it('should update client', async () => {
      const updatedClient = { ...mockClient, phone: '09 987 6543' };
      vi.mocked(repository.findById).mockResolvedValue(mockClient);
      vi.mocked(repository.update).mockResolvedValue(updatedClient);

      const result = await service.update('client-1', { phone: '09 987 6543' });
      expect(result.phone).toBe('09 987 6543');
    });

    it('should throw ClientNotFoundError for non-existent client', async () => {
      vi.mocked(repository.findById).mockResolvedValue(null);

      await expect(
        service.update('non-existent', { phone: '09 987 6543' })
      ).rejects.toThrow(ClientNotFoundError);
    });
  });
});
