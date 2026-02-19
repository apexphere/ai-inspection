import type { Document, DocumentType, DocumentStatus } from '@prisma/client';
import type {
  IDocumentRepository,
  CreateDocumentInput,
  UpdateDocumentInput,
  DocumentSearchParams,
} from '../repositories/interfaces/document.js';

export class DocumentNotFoundError extends Error {
  constructor(id: string) {
    super(`Document not found: ${id}`);
    this.name = 'DocumentNotFoundError';
  }
}

export interface DocumentSummary {
  total: number;
  byStatus: Record<DocumentStatus, number>;
  byType: Record<DocumentType, number>;
  required: number;
  received: number;
  outstanding: number;
  completionPercentage: number;
}

// Auto-linking rules based on document type
const CLAUSE_LINKS: Partial<Record<DocumentType, string[]>> = {
  PS3: ['B1', 'E2', 'E3', 'G12', 'G13'], // Producer Statement Construction
  COC: ['G9'], // Electrical Certificate
  ESC: ['G9'], // Electrical Safety Certificate
  WARRANTY: ['B2'], // Durability
};

export class DocumentService {
  constructor(private repository: IDocumentRepository) {}

  async create(input: CreateDocumentInput): Promise<Document> {
    // Auto-link clauses based on document type if not provided
    let linkedClauses = input.linkedClauses;
    if (!linkedClauses || linkedClauses.length === 0) {
      linkedClauses = CLAUSE_LINKS[input.documentType] || [];
    }

    return this.repository.create({
      ...input,
      linkedClauses,
      status: input.status || 'RECEIVED', // Default to RECEIVED when uploading
    });
  }

  async findAll(params?: DocumentSearchParams): Promise<Document[]> {
    return this.repository.findAll(params);
  }

  async findById(id: string): Promise<Document> {
    const document = await this.repository.findById(id);
    if (!document) {
      throw new DocumentNotFoundError(id);
    }
    return document;
  }

  async findByProjectId(projectId: string): Promise<Document[]> {
    return this.repository.findByProjectId(projectId);
  }

  async update(id: string, input: UpdateDocumentInput): Promise<Document> {
    await this.findById(id);
    return this.repository.update(id, input);
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.repository.delete(id);
  }

  async markAsReceived(id: string): Promise<Document> {
    return this.update(id, { status: 'RECEIVED' });
  }

  async markAsOutstanding(id: string): Promise<Document> {
    return this.update(id, { status: 'OUTSTANDING' });
  }

  async markAsNA(id: string): Promise<Document> {
    return this.update(id, { status: 'NA' });
  }

  async verify(id: string, verified: boolean): Promise<Document> {
    return this.update(id, { verified });
  }

  async linkClauses(id: string, clauseCodes: string[]): Promise<Document> {
    return this.update(id, { linkedClauses: clauseCodes });
  }

  async reorder(projectId: string, documentIds: string[]): Promise<void> {
    return this.repository.reorder(projectId, documentIds);
  }

  async getSummary(projectId: string): Promise<DocumentSummary> {
    const documents = await this.findByProjectId(projectId);

    const summary: DocumentSummary = {
      total: documents.length,
      byStatus: {
        REQUIRED: 0,
        RECEIVED: 0,
        OUTSTANDING: 0,
        NA: 0,
      },
      byType: {} as Record<DocumentType, number>,
      required: 0,
      received: 0,
      outstanding: 0,
      completionPercentage: 0,
    };

    for (const doc of documents) {
      // Count by status
      summary.byStatus[doc.status]++;

      // Count by type
      if (!summary.byType[doc.documentType]) {
        summary.byType[doc.documentType] = 0;
      }
      summary.byType[doc.documentType]++;

      // Track required/received/outstanding
      if (doc.status === 'REQUIRED' || doc.status === 'OUTSTANDING') {
        summary.required++;
        if (doc.status === 'OUTSTANDING') {
          summary.outstanding++;
        }
      } else if (doc.status === 'RECEIVED') {
        summary.received++;
      }
    }

    // Calculate completion percentage
    const totalRequired = summary.required + summary.received;
    if (totalRequired > 0) {
      summary.completionPercentage = Math.round((summary.received / totalRequired) * 100);
    } else {
      summary.completionPercentage = 100; // No required documents = complete
    }

    return summary;
  }

  async getOutstandingDocuments(projectId: string): Promise<Document[]> {
    return this.repository.findAll({
      projectId,
      status: 'OUTSTANDING',
    });
  }

  async getRequiredDocuments(projectId: string): Promise<Document[]> {
    return this.repository.findAll({
      projectId,
      status: 'REQUIRED',
    });
  }

  async canFinalize(projectId: string): Promise<{ canFinalize: boolean; blockers: string[] }> {
    const outstanding = await this.getOutstandingDocuments(projectId);
    const required = await this.getRequiredDocuments(projectId);

    const blockers: string[] = [];

    for (const doc of [...outstanding, ...required]) {
      blockers.push(`${doc.documentType}: ${doc.description} (${doc.status})`);
    }

    return {
      canFinalize: blockers.length === 0,
      blockers,
    };
  }
}
