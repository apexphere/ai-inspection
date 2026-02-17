import { PrismaClient, type Inspection, type Finding, type Photo, type Report } from '@prisma/client';
import type {
  IInspectionRepository,
  CreateInspectionInput,
  UpdateInspectionInput,
  CreateFindingInput,
  UpdateFindingInput,
  CreatePhotoInput,
  CreateReportInput,
} from '../interfaces/inspection.js';

export class PrismaInspectionRepository implements IInspectionRepository {
  constructor(private prisma: PrismaClient) {}

  // Inspections
  async create(input: CreateInspectionInput): Promise<Inspection> {
    return this.prisma.inspection.create({
      data: input,
    });
  }

  async findById(id: string): Promise<Inspection | null> {
    return this.prisma.inspection.findUnique({
      where: { id },
      include: {
        findings: {
          include: { photos: true },
        },
        reports: true,
      },
    });
  }

  async findAll(): Promise<Inspection[]> {
    return this.prisma.inspection.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, input: UpdateInspectionInput): Promise<Inspection> {
    return this.prisma.inspection.update({
      where: { id },
      data: input,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.inspection.delete({
      where: { id },
    });
  }

  // Findings
  async createFinding(input: CreateFindingInput): Promise<Finding> {
    return this.prisma.finding.create({
      data: input,
    });
  }

  async findFindingById(id: string): Promise<Finding | null> {
    return this.prisma.finding.findUnique({
      where: { id },
      include: { photos: true },
    });
  }

  async findFindingsByInspection(inspectionId: string): Promise<Finding[]> {
    return this.prisma.finding.findMany({
      where: { inspectionId },
      include: { photos: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async updateFinding(id: string, input: UpdateFindingInput): Promise<Finding> {
    return this.prisma.finding.update({
      where: { id },
      data: input,
    });
  }

  async deleteFinding(id: string): Promise<void> {
    await this.prisma.finding.delete({
      where: { id },
    });
  }

  // Photos
  async createPhoto(input: CreatePhotoInput): Promise<Photo> {
    return this.prisma.photo.create({
      data: input,
    });
  }

  async findPhotoById(id: string): Promise<Photo | null> {
    return this.prisma.photo.findUnique({
      where: { id },
    });
  }

  async findPhotosByFinding(findingId: string): Promise<Photo[]> {
    return this.prisma.photo.findMany({
      where: { findingId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async deletePhoto(id: string): Promise<void> {
    await this.prisma.photo.delete({
      where: { id },
    });
  }

  // Reports
  async createReport(input: CreateReportInput): Promise<Report> {
    return this.prisma.report.create({
      data: input,
    });
  }

  async findReportById(id: string): Promise<Report | null> {
    return this.prisma.report.findUnique({
      where: { id },
    });
  }

  async findReportsByInspection(inspectionId: string): Promise<Report[]> {
    return this.prisma.report.findMany({
      where: { inspectionId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
