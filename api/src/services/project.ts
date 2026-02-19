import type { Project, Property, Client } from '@prisma/client';
import type {
  IProjectRepository,
  IPropertyRepository,
  IClientRepository,
  CreateProjectInput,
  UpdateProjectInput,
  ProjectSearchParams,
  CreatePropertyInput,
  UpdatePropertyInput,
  PropertySearchParams,
  CreateClientInput,
  UpdateClientInput,
  ClientSearchParams,
} from '../repositories/interfaces/project.js';

export class ProjectNotFoundError extends Error {
  constructor(id: string) {
    super(`Project not found: ${id}`);
    this.name = 'ProjectNotFoundError';
  }
}

export class PropertyNotFoundError extends Error {
  constructor(id: string) {
    super(`Property not found: ${id}`);
    this.name = 'PropertyNotFoundError';
  }
}

export class ClientNotFoundError extends Error {
  constructor(id: string) {
    super(`Client not found: ${id}`);
    this.name = 'ClientNotFoundError';
  }
}

export class ProjectService {
  constructor(private repository: IProjectRepository) {}

  async create(input: CreateProjectInput): Promise<Project> {
    const jobNumber = input.jobNumber || await this.repository.generateJobNumber();
    return this.repository.create({ ...input, jobNumber });
  }

  async findAll(params?: ProjectSearchParams): Promise<Project[]> {
    return this.repository.findAll(params);
  }

  async findById(id: string): Promise<Project> {
    const project = await this.repository.findById(id);
    if (!project) {
      throw new ProjectNotFoundError(id);
    }
    return project;
  }

  async findByJobNumber(jobNumber: string): Promise<Project> {
    const project = await this.repository.findByJobNumber(jobNumber);
    if (!project) {
      throw new ProjectNotFoundError(jobNumber);
    }
    return project;
  }

  async update(id: string, input: UpdateProjectInput): Promise<Project> {
    await this.findById(id);
    return this.repository.update(id, input);
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.repository.delete(id);
  }
}

export class PropertyService {
  constructor(private repository: IPropertyRepository) {}

  async create(input: CreatePropertyInput): Promise<Property> {
    return this.repository.create(input);
  }

  async findAll(params?: PropertySearchParams): Promise<Property[]> {
    return this.repository.findAll(params);
  }

  async findById(id: string): Promise<Property> {
    const property = await this.repository.findById(id);
    if (!property) {
      throw new PropertyNotFoundError(id);
    }
    return property;
  }

  async update(id: string, input: UpdatePropertyInput): Promise<Property> {
    await this.findById(id);
    return this.repository.update(id, input);
  }
}

export class ClientService {
  constructor(private repository: IClientRepository) {}

  async create(input: CreateClientInput): Promise<Client> {
    return this.repository.create(input);
  }

  async findAll(params?: ClientSearchParams): Promise<Client[]> {
    return this.repository.findAll(params);
  }

  async findById(id: string): Promise<Client> {
    const client = await this.repository.findById(id);
    if (!client) {
      throw new ClientNotFoundError(id);
    }
    return client;
  }

  async update(id: string, input: UpdateClientInput): Promise<Client> {
    await this.findById(id);
    return this.repository.update(id, input);
  }
}
