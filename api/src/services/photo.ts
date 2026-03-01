import { logger } from '../lib/logger.js';
/**
 * Photo Service
 * Issue #524 - Updated to use R2 storage in production
 * 
 * Stores finding photos in Cloudflare R2 (production) or local disk (development).
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import type { Photo } from '@prisma/client';
import type { IInspectionRepository, CreatePhotoInput } from '../repositories/interfaces/inspection.js';
import { FindingNotFoundError } from './finding.js';
import { uploadToR2, downloadFromR2, deleteFromR2, isR2Configured } from './r2-storage.js';

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
  private useR2: boolean;

  constructor(private repository: IInspectionRepository, photoDir?: string) {
    this.photoDir = photoDir || process.env.PHOTO_DIR || './uploads/photos';
    this.useR2 = isR2Configured();
    
    if (this.useR2) {
      logger.info('Using R2 storage');
    } else {
      logger.info('Using local storage (R2 not configured)');
    }
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
      buffer = Buffer.from(base64Data, 'base64');
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

    let storagePath: string;

    if (this.useR2) {
      // Upload to R2
      const r2Key = `findings/${input.findingId}/${filename}`;
      await uploadToR2(r2Key, buffer, mimeType);
      storagePath = `r2://${r2Key}`;
      logger.info({ r2Key }, "Uploaded to R2");
    } else {
      // Write to local disk (development fallback)
      await fs.mkdir(this.photoDir, { recursive: true });
      const filePath = path.join(this.photoDir, filename);
      await fs.writeFile(filePath, buffer);
      storagePath = filePath;
    }

    // Create database record
    const photoInput: CreatePhotoInput = {
      findingId: input.findingId,
      filename,
      path: storagePath,
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
    const finding = await this.repository.findFindingById(findingId);
    if (!finding) {
      throw new FindingNotFoundError(findingId);
    }
    return this.repository.findPhotosByFinding(findingId);
  }

  /**
   * Get photo file buffer (from R2 or local disk)
   */
  async getFileBuffer(id: string): Promise<Buffer> {
    const photo = await this.findById(id);
    
    if (photo.path.startsWith('r2://')) {
      // Download from R2
      const r2Key = photo.path.replace('r2://', '');
      return downloadFromR2(r2Key);
    } else {
      // Read from local disk
      return fs.readFile(photo.path);
    }
  }

  async delete(id: string): Promise<void> {
    const photo = await this.findById(id);

    if (photo.path.startsWith('r2://')) {
      // Delete from R2
      const r2Key = photo.path.replace('r2://', '');
      try {
        await deleteFromR2(r2Key);
      } catch (err) {
        logger.warn({ r2Key, err }, "Failed to delete from R2");
      }
    } else {
      // Delete from local disk
      try {
        await fs.unlink(photo.path);
      } catch (err) {
        logger.warn({ path: photo.path, err }, 'Failed to delete photo file');
      }
    }

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
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(str)) {
      return false;
    }
    if (str.length % 4 !== 0) {
      return false;
    }
    return true;
  }
}
