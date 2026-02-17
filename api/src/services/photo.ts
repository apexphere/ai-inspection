import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import type { Photo } from '@prisma/client';
import type { IInspectionRepository, CreatePhotoInput } from '../repositories/interfaces/inspection.js';
import { FindingNotFoundError } from './finding.js';

export { FindingNotFoundError };

export class PhotoNotFoundError extends Error {
  constructor(id: string) {
    super(`Photo not found: ${id}`);
    this.name = 'PhotoNotFoundError';
  }
}

export class InvalidBase64Error extends Error {
  constructor() {
    super('Invalid base64 data');
    this.name = 'InvalidBase64Error';
  }
}

export interface UploadPhotoInput {
  findingId: string;
  base64Data: string;
  mimeType?: string;
}

export class PhotoService {
  private photoDir: string;

  constructor(private repository: IInspectionRepository, photoDir?: string) {
    this.photoDir = photoDir || process.env.PHOTO_DIR || './uploads/photos';
  }

  async upload(input: UploadPhotoInput): Promise<Photo> {
    // Verify finding exists
    const finding = await this.repository.findFindingById(input.findingId);
    if (!finding) {
      throw new FindingNotFoundError(input.findingId);
    }

    // Parse base64 data
    let base64Data = input.base64Data;
    let mimeType = input.mimeType || 'image/jpeg';

    // Handle data URL format (e.g., "data:image/png;base64,...")
    if (base64Data.startsWith('data:')) {
      const matches = base64Data.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        mimeType = matches[1] as string;
        base64Data = matches[2] as string;
      }
    }

    // Validate base64
    let buffer: Buffer;
    try {
      // Check if it's valid base64 by verifying it can be decoded and re-encoded
      buffer = Buffer.from(base64Data, 'base64');
      const reEncoded = buffer.toString('base64');
      // Allow some padding differences, but core content must match
      if (buffer.length === 0 || !this.isValidBase64(base64Data)) {
        throw new InvalidBase64Error();
      }
    } catch (err) {
      if (err instanceof InvalidBase64Error) {
        throw err;
      }
      throw new InvalidBase64Error();
    }

    // Generate unique filename
    const ext = this.getExtensionFromMimeType(mimeType);
    const filename = `${crypto.randomUUID()}${ext}`;

    // Ensure directory exists
    await fs.mkdir(this.photoDir, { recursive: true });

    // Write file
    const filePath = path.join(this.photoDir, filename);
    await fs.writeFile(filePath, buffer);

    // Create database record
    const photoInput: CreatePhotoInput = {
      findingId: input.findingId,
      filename,
      path: filePath,
      mimeType,
    };

    return this.repository.createPhoto(photoInput);
  }

  async findById(id: string): Promise<Photo> {
    const photo = await this.repository.findPhotoById(id);
    if (!photo) {
      throw new PhotoNotFoundError(id);
    }
    return photo;
  }

  async findByFinding(findingId: string): Promise<Photo[]> {
    // Verify finding exists
    const finding = await this.repository.findFindingById(findingId);
    if (!finding) {
      throw new FindingNotFoundError(findingId);
    }
    return this.repository.findPhotosByFinding(findingId);
  }

  async delete(id: string): Promise<void> {
    // Get photo first to get file path
    const photo = await this.findById(id);

    // Delete file from disk
    try {
      await fs.unlink(photo.path);
    } catch (err) {
      // Log but don't fail if file doesn't exist
      console.warn(`Failed to delete photo file: ${photo.path}`, err);
    }

    // Delete database record
    await this.repository.deletePhoto(id);
  }

  async getFilePath(id: string): Promise<string> {
    const photo = await this.findById(id);
    return photo.path;
  }

  private getExtensionFromMimeType(mimeType: string): string {
    const extensions: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
    };
    return extensions[mimeType] || '.jpg';
  }

  private isValidBase64(str: string): boolean {
    // Valid base64 pattern: alphanumeric, +, /, and optional = padding
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(str)) {
      return false;
    }
    // Length should be a multiple of 4 (accounting for padding)
    if (str.length % 4 !== 0) {
      return false;
    }
    return true;
  }
}
