import { PrismaClient, type Document } from '@prisma/client';
import type {
  IDocumentRepository,
  CreateDocumentInput,
  UpdateDocumentInput,
  DocumentSearchParams,
} from '../interfaces/document.js';

export class PrismaDocumentRepository implements IDocumentRepository {
  constructor(private prisma: PrismaClient) {}

  async create(input: CreateDocumentInput): Promise<Document> {
    // Auto-assign appendix letter if not provided
    let appendixLetter = input.appendixLetter;
    if (!appendixLetter) {
      appendixLetter = await this.getNextAppendixLetter(input.projectId);
    }

    return this.prisma.document.create({
      data: {
        ...input,
        appendixLetter,
      },
    });
  }

  async findById(id: string): Promise<Document | null> {
    return this.prisma.document.findUnique({
      where: { id },
    });
  }

  async findByProjectId(projectId: string): Promise<Document[]> {
    return this.prisma.document.findMany({
      where: { projectId },
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'asc' },
      ],
    });
  }

  async findAll(params?: DocumentSearchParams): Promise<Document[]> {
    const where: Record<string, unknown> = {};

    if (params?.projectId) {
      where.projectId = params.projectId;
    }
    if (params?.documentType) {
      where.documentType = params.documentType;
    }
    if (params?.status) {
      where.status = params.status;
    }

    return this.prisma.document.findMany({
      where,
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'asc' },
      ],
    });
  }

  async update(id: string, input: UpdateDocumentInput): Promise<Document> {
    return this.prisma.document.update({
      where: { id },
      data: input,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.document.delete({
      where: { id },
    });
  }

  async getNextAppendixLetter(projectId: string): Promise<string> {
    // Get all existing documents for this project
    const documents = await this.prisma.document.findMany({
      where: { projectId },
      select: { appendixLetter: true },
      orderBy: { appendixLetter: 'desc' },
    });

    if (documents.length === 0) {
      return 'A';
    }

    // Find the highest letter used
    const usedLetters = documents
      .map(d => d.appendixLetter)
      .filter((letter): letter is string => letter !== null);

    if (usedLetters.length === 0) {
      return 'A';
    }

    // Sort and get the highest
    usedLetters.sort();
    const highestLetter = usedLetters[usedLetters.length - 1];

    // Get next letter (A -> B, B -> C, etc.)
    if (highestLetter === 'Z') {
      // Handle overflow - could extend to AA, AB, etc. if needed
      throw new Error('Maximum appendix letters reached');
    }

    return String.fromCharCode(highestLetter.charCodeAt(0) + 1);
  }

  async reorder(projectId: string, documentIds: string[]): Promise<void> {
    await this.prisma.$transaction(
      documentIds.map((id, index) =>
        this.prisma.document.updateMany({
          where: { id, projectId }, // Verify ownership
          data: { sortOrder: index },
        })
      )
    );
  }
}
