import { PrismaClient, type Project, type Property, type Client } from '@prisma/client';
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
} from '../interfaces/project.js';

export class PrismaProjectRepository implements IProjectRepository {
  constructor(private prisma: PrismaClient) {}

  async create(input: CreateProjectInput & { jobNumber: string }): Promise<Project> {
    return this.prisma.project.create({
      data: input,
      include: {
        property: true,
        client: true,
      },
    });
  }

  async findById(id: string): Promise<Project | null> {
    return this.prisma.project.findUnique({
      where: { id },
      include: {
        property: true,
        client: true,
      },
    });
  }

  async findByJobNumber(jobNumber: string): Promise<Project | null> {
    return this.prisma.project.findUnique({
      where: { jobNumber },
      include: {
        property: true,
        client: true,
      },
    });
  }

  async findAll(params?: ProjectSearchParams): Promise<Project[]> {
    const where: Record<string, unknown> = {};

    if (params?.jobNumber) {
      where.jobNumber = { contains: params.jobNumber, mode: 'insensitive' };
    }
    if (params?.status) {
      where.status = params.status;
    }
    if (params?.reportType) {
      where.reportType = params.reportType;
    }
    if (params?.address) {
      where.property = {
        streetAddress: { contains: params.address, mode: 'insensitive' },
      };
    }
    if (params?.clientName) {
      where.client = {
        name: { contains: params.clientName, mode: 'insensitive' },
      };
    }

    return this.prisma.project.findMany({
      where,
      include: {
        property: true,
        client: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, input: UpdateProjectInput): Promise<Project> {
    return this.prisma.project.update({
      where: { id },
      data: input,
      include: {
        property: true,
        client: true,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.project.delete({
      where: { id },
    });
  }

  async generateJobNumber(): Promise<string> {
    const now = new Date();
    const datePrefix = now.toISOString().slice(2, 10).replace(/-/g, '');
    
    // Find existing job numbers for today
    const existingToday = await this.prisma.project.findMany({
      where: {
        jobNumber: { startsWith: datePrefix },
      },
      select: { jobNumber: true },
      orderBy: { jobNumber: 'desc' },
    });

    let sequence = 1;
    if (existingToday.length > 0) {
      const lastNumber = existingToday[0]?.jobNumber;
      if (lastNumber) {
        const lastSequence = parseInt(lastNumber.split('-')[1] || '0', 10);
        sequence = lastSequence + 1;
      }
    }

    return `${datePrefix}-${sequence.toString().padStart(3, '0')}`;
  }
}

export class PrismaPropertyRepository implements IPropertyRepository {
  constructor(private prisma: PrismaClient) {}

  async create(input: CreatePropertyInput): Promise<Property> {
    return this.prisma.property.create({
      data: input,
    });
  }

  async findById(id: string): Promise<Property | null> {
    return this.prisma.property.findUnique({
      where: { id },
      include: {
        projects: true,
      },
    });
  }

  async findAll(params?: PropertySearchParams): Promise<Property[]> {
    const where: Record<string, unknown> = {};

    if (params?.address) {
      where.streetAddress = { contains: params.address, mode: 'insensitive' };
    }
    if (params?.suburb) {
      where.suburb = { contains: params.suburb, mode: 'insensitive' };
    }
    if (params?.city) {
      where.city = { contains: params.city, mode: 'insensitive' };
    }
    if (params?.territorialAuthority) {
      where.territorialAuthority = params.territorialAuthority;
    }

    return this.prisma.property.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, input: UpdatePropertyInput): Promise<Property> {
    return this.prisma.property.update({
      where: { id },
      data: input,
    });
  }
}

export class PrismaClientRepository implements IClientRepository {
  constructor(private prisma: PrismaClient) {}

  async create(input: CreateClientInput): Promise<Client> {
    return this.prisma.client.create({
      data: input,
    });
  }

  async findById(id: string): Promise<Client | null> {
    return this.prisma.client.findUnique({
      where: { id },
      include: {
        projects: true,
      },
    });
  }

  async findAll(params?: ClientSearchParams): Promise<Client[]> {
    const where: Record<string, unknown> = {};

    if (params?.name) {
      where.name = { contains: params.name, mode: 'insensitive' };
    }
    if (params?.email) {
      where.email = { contains: params.email, mode: 'insensitive' };
    }

    return this.prisma.client.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, input: UpdateClientInput): Promise<Client> {
    return this.prisma.client.update({
      where: { id },
      data: input,
    });
  }
}
