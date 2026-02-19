import type { Project, Property, Client, ReportType, ProjectStatus, TerritorialAuthority, Prisma } from '@prisma/client';

// Project interfaces
export interface CreateProjectInput {
  jobNumber?: string; // Optional - auto-generate if not provided
  activity: string;
  reportType: ReportType;
  propertyId: string;
  clientId: string;
}

export interface UpdateProjectInput {
  jobNumber?: string;
  activity?: string;
  reportType?: ReportType;
  status?: ProjectStatus;
  propertyId?: string;
  clientId?: string;
}

export interface ProjectSearchParams {
  jobNumber?: string;
  address?: string;
  clientName?: string;
  status?: ProjectStatus;
  reportType?: ReportType;
}

// Property interfaces
export interface CreatePropertyInput {
  streetAddress: string;
  suburb?: string;
  city?: string;
  postcode?: string;
  lotDp?: string;
  councilPropertyId?: string;
  territorialAuthority: TerritorialAuthority;
  bcNumber?: string;
  yearBuilt?: number;
  siteData?: Prisma.InputJsonValue;
  construction?: Prisma.InputJsonValue;
}

export interface UpdatePropertyInput {
  streetAddress?: string;
  suburb?: string;
  city?: string;
  postcode?: string;
  lotDp?: string;
  councilPropertyId?: string;
  territorialAuthority?: TerritorialAuthority;
  bcNumber?: string;
  yearBuilt?: number;
  siteData?: Prisma.InputJsonValue;
  construction?: Prisma.InputJsonValue;
}

export interface PropertySearchParams {
  address?: string;
  suburb?: string;
  city?: string;
  territorialAuthority?: TerritorialAuthority;
}

// Client interfaces
export interface CreateClientInput {
  name: string;
  email?: string;
  phone?: string;
  mobile?: string;
  address?: string;
  contactPerson?: string;
}

export interface UpdateClientInput {
  name?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  address?: string;
  contactPerson?: string;
}

export interface ClientSearchParams {
  name?: string;
  email?: string;
}

// Repository interfaces
export interface IProjectRepository {
  create(input: CreateProjectInput & { jobNumber: string }): Promise<Project>;
  findById(id: string): Promise<Project | null>;
  findByJobNumber(jobNumber: string): Promise<Project | null>;
  findAll(params?: ProjectSearchParams): Promise<Project[]>;
  update(id: string, input: UpdateProjectInput): Promise<Project>;
  delete(id: string): Promise<void>;
  generateJobNumber(): Promise<string>;
}

export interface IPropertyRepository {
  create(input: CreatePropertyInput): Promise<Property>;
  findById(id: string): Promise<Property | null>;
  findAll(params?: PropertySearchParams): Promise<Property[]>;
  update(id: string, input: UpdatePropertyInput): Promise<Property>;
}

export interface IClientRepository {
  create(input: CreateClientInput): Promise<Client>;
  findById(id: string): Promise<Client | null>;
  findAll(params?: ClientSearchParams): Promise<Client[]>;
  update(id: string, input: UpdateClientInput): Promise<Client>;
}
