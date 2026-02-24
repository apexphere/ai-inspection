import { PrismaClient, type Company } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateCompanyInput {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
}

export interface UpdateCompanyInput {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logoPath?: string;
}

export async function createCompany(data: CreateCompanyInput): Promise<Company> {
  return prisma.company.create({ data });
}

export async function getCompanyById(id: string): Promise<Company | null> {
  return prisma.company.findUnique({ where: { id } });
}

export async function listCompanies(): Promise<Company[]> {
  return prisma.company.findMany({
    orderBy: { name: 'asc' },
  });
}

export async function updateCompany(id: string, data: UpdateCompanyInput): Promise<Company> {
  return prisma.company.update({
    where: { id },
    data,
  });
}

export async function deleteCompany(id: string): Promise<Company> {
  return prisma.company.delete({ where: { id } });
}
