import type { PrismaClient, Personnel } from '@prisma/client';
import type {
  IPersonnelRepository,
  CreatePersonnelInput,
  UpdatePersonnelInput,
  PersonnelSearchParams,
} from '../interfaces/personnel.js';

export class PrismaPersonnelRepository implements IPersonnelRepository {
  constructor(private prisma: PrismaClient) {}

  async create(input: CreatePersonnelInput): Promise<Personnel> {
    return this.prisma.personnel.create({
      data: input,
    });
  }

  async findById(id: string): Promise<Personnel | null> {
    return this.prisma.personnel.findUnique({
      where: { id },
    });
  }

  async findAll(params?: PersonnelSearchParams): Promise<Personnel[]> {
    const where: Record<string, unknown> = {};

    if (params?.role) {
      where.role = params.role;
    }
    if (params?.active !== undefined) {
      where.active = params.active;
    }
    if (params?.name) {
      where.name = { contains: params.name, mode: 'insensitive' };
    }

    return this.prisma.personnel.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async findByEmail(email: string): Promise<Personnel | null> {
    return this.prisma.personnel.findUnique({
      where: { email },
    });
  }

  async update(id: string, input: UpdatePersonnelInput): Promise<Personnel> {
    return this.prisma.personnel.update({
      where: { id },
      data: input,
    });
  }
}
