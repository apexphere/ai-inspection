import { PrismaClient, type Credential } from '@prisma/client';
import type {
  ICredentialRepository,
  CreateCredentialInput,
  UpdateCredentialInput,
} from '../interfaces/credential.js';

export class PrismaCredentialRepository implements ICredentialRepository {
  constructor(private prisma: PrismaClient) {}

  async create(input: CreateCredentialInput): Promise<Credential> {
    return this.prisma.credential.create({
      data: {
        ...input,
        qualifications: input.qualifications || [],
      },
    });
  }

  async findById(id: string): Promise<Credential | null> {
    return this.prisma.credential.findUnique({
      where: { id },
    });
  }

  async findByPersonnelId(personnelId: string): Promise<Credential[]> {
    return this.prisma.credential.findMany({
      where: { personnelId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async update(id: string, input: UpdateCredentialInput): Promise<Credential> {
    return this.prisma.credential.update({
      where: { id },
      data: input,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.credential.delete({
      where: { id },
    });
  }
}
