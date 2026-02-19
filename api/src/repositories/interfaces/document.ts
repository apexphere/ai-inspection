import type { Document, DocumentType, DocumentStatus } from '@prisma/client';

export interface CreateDocumentInput {
  projectId: string;
  filePath: string;
  filename: string;
  documentType: DocumentType;
  description: string;
  appendixLetter?: string;
  issuer?: string;
  issuedAt?: Date;
  referenceNumber?: string;
  status?: DocumentStatus;
  verified?: boolean;
  linkedClauses?: string[];
  sortOrder?: number;
}

export interface UpdateDocumentInput {
  appendixLetter?: string;
  filePath?: string;
  filename?: string;
  documentType?: DocumentType;
  description?: string;
  issuer?: string | null;
  issuedAt?: Date | null;
  referenceNumber?: string | null;
  status?: DocumentStatus;
  verified?: boolean;
  linkedClauses?: string[];
  sortOrder?: number;
}

export interface DocumentSearchParams {
  projectId?: string;
  documentType?: DocumentType;
  status?: DocumentStatus;
}

export interface IDocumentRepository {
  create(input: CreateDocumentInput): Promise<Document>;
  findById(id: string): Promise<Document | null>;
  findByProjectId(projectId: string): Promise<Document[]>;
  findAll(params?: DocumentSearchParams): Promise<Document[]>;
  update(id: string, input: UpdateDocumentInput): Promise<Document>;
  delete(id: string): Promise<void>;
  getNextAppendixLetter(projectId: string): Promise<string>;
  reorder(projectId: string, documentIds: string[]): Promise<void>;
}
