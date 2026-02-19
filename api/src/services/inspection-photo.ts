import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import type { InspectionPhoto, PhotoSource } from '@prisma/client';
import type { IInspectionPhotoRepository, UpdateInspectionPhotoInput } from '../repositories/interfaces/inspection-photo.js';

export class InspectionPhotoNotFoundError extends Error {
  constructor(id: string) {
    super(`Inspection photo not found: ${id}`);
    this.name = 'InspectionPhotoNotFoundError';
  }
}

export class InvalidBase64Error extends Error {
  constructor() {
    super('Invalid base64 data');
    this.name = 'InvalidBase64Error';
  }
}

export interface UploadPhotoInput {
  projectId: string;
  inspectionId?: string;
  base64Data: string;
  mimeType?: string;
  caption: string;
  source?: PhotoSource;
  linkedClauses?: string[];
  linkedItemId?: string;
  linkedItemType?: 'ChecklistItem' | 'ClauseReview';
}

export class InspectionPhotoService {
  private uploadDir: string;

  constructor(private repository: IInspectionPhotoRepository) {
    this.uploadDir = process.env.UPLOAD_DIR || './data/photos';
  }

  async upload(input: UploadPhotoInput): Promise<InspectionPhoto> {
    // Validate and decode base64
    let buffer: Buffer;
    try {
      // Remove data URL prefix if present
      const base64Data = input.base64Data.replace(/^data:[^;]+;base64,/, '');
      buffer = Buffer.from(base64Data, 'base64');
      if (buffer.length === 0) {
        throw new InvalidBase64Error();
      }
    } catch {
      throw new InvalidBase64Error();
    }

    // Determine file extension from MIME type
    const mimeType = input.mimeType || 'image/jpeg';
    const ext = this.getExtensionFromMime(mimeType);
    
    // Generate unique filename
    const filename = `${crypto.randomUUID()}${ext}`;
    const projectDir = path.join(this.uploadDir, input.projectId);
    const filePath = path.join(projectDir, filename);

    // Ensure directory exists
    await fs.mkdir(projectDir, { recursive: true });

    // Write file
    await fs.writeFile(filePath, buffer);

    // Create database record
    return this.repository.create({
      projectId: input.projectId,
      inspectionId: input.inspectionId,
      filePath,
      filename,
      mimeType,
      caption: input.caption,
      source: input.source,
      linkedClauses: input.linkedClauses,
      linkedItemId: input.linkedItemId,
      linkedItemType: input.linkedItemType,
    });
  }

  async findById(id: string): Promise<InspectionPhoto> {
    const photo = await this.repository.findById(id);
    if (!photo) {
      throw new InspectionPhotoNotFoundError(id);
    }
    return photo;
  }

  async findByProjectId(projectId: string): Promise<InspectionPhoto[]> {
    return this.repository.findByProjectId(projectId);
  }

  async findByInspectionId(inspectionId: string): Promise<InspectionPhoto[]> {
    return this.repository.findByInspectionId(inspectionId);
  }

  async update(id: string, input: UpdateInspectionPhotoInput): Promise<InspectionPhoto> {
    // Verify exists
    await this.findById(id);
    return this.repository.update(id, input);
  }

  async delete(id: string): Promise<void> {
    const photo = await this.findById(id);
    
    // Delete file from disk
    try {
      await fs.unlink(photo.filePath);
      if (photo.thumbnailPath) {
        await fs.unlink(photo.thumbnailPath);
      }
    } catch {
      // File may already be deleted, continue
    }

    await this.repository.delete(id);
  }

  async reorder(projectId: string, photoIds: string[]): Promise<void> {
    await this.repository.reorder(projectId, photoIds);
  }

  private getExtensionFromMime(mimeType: string): string {
    const mimeToExt: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'image/heic': '.heic',
    };
    return mimeToExt[mimeType] || '.jpg';
  }
}
