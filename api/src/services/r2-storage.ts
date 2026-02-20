import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// R2 configuration from environment
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'ai-inspection-photos';

// Presigned URL expiry (1 hour)
const PRESIGNED_URL_EXPIRY_SECONDS = 3600;

// Check if R2 is configured
export function isR2Configured(): boolean {
  return !!(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY);
}

// Lazy initialization of S3 client
let r2Client: S3Client | null = null;

function getR2Client(): S3Client {
  if (!r2Client) {
    if (!isR2Configured()) {
      throw new Error('R2 storage is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY.');
    }

    r2Client = new S3Client({
      region: 'auto',
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID!,
        secretAccessKey: R2_SECRET_ACCESS_KEY!,
      },
    });
  }
  return r2Client;
}

/**
 * Generate a storage key for a photo
 * Format: photos/{projectId}/{uuid}.{ext}
 */
export function generatePhotoKey(projectId: string, filename: string): string {
  const ext = filename.split('.').pop() || 'jpg';
  const uuid = crypto.randomUUID();
  return `photos/${projectId}/${uuid}.${ext}`;
}

/**
 * Generate a storage key for a thumbnail
 * Format: thumbnails/{projectId}/{uuid}.jpg
 */
export function generateThumbnailKey(projectId: string, _filename: string): string {
  const uuid = crypto.randomUUID();
  return `thumbnails/${projectId}/${uuid}.jpg`;
}

/**
 * Upload a file to R2
 */
export async function uploadToR2(
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<void> {
  const client = getR2Client();

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await client.send(command);
}

/**
 * Get a presigned URL for downloading a file
 */
export async function getPresignedUrl(key: string): Promise<string> {
  const client = getR2Client();

  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });

  return getSignedUrl(client, command, {
    expiresIn: PRESIGNED_URL_EXPIRY_SECONDS,
  });
}

/**
 * Delete a file from R2
 */
export async function deleteFromR2(key: string): Promise<void> {
  const client = getR2Client();

  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });

  await client.send(command);
}

/**
 * Check if a file exists in R2
 */
export async function existsInR2(key: string): Promise<boolean> {
  const client = getR2Client();

  try {
    const command = new HeadObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });
    await client.send(command);
    return true;
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'name' in error && error.name === 'NotFound') {
      return false;
    }
    throw error;
  }
}

/**
 * Upload photo with thumbnail to R2
 * Returns the keys for both files
 */
export async function uploadPhotoWithThumbnail(
  projectId: string,
  photoBuffer: Buffer,
  thumbnailBuffer: Buffer,
  mimeType: string,
  originalFilename: string
): Promise<{ photoKey: string; thumbnailKey: string }> {
  const photoKey = generatePhotoKey(projectId, originalFilename);
  const thumbnailKey = generateThumbnailKey(projectId, originalFilename);

  // Upload both in parallel
  await Promise.all([
    uploadToR2(photoKey, photoBuffer, mimeType),
    uploadToR2(thumbnailKey, thumbnailBuffer, 'image/jpeg'),
  ]);

  return { photoKey, thumbnailKey };
}

/**
 * Delete photo and thumbnail from R2
 */
export async function deletePhotoWithThumbnail(
  photoKey: string,
  thumbnailKey: string | null
): Promise<void> {
  const deletions = [deleteFromR2(photoKey)];
  if (thumbnailKey) {
    deletions.push(deleteFromR2(thumbnailKey));
  }
  await Promise.all(deletions);
}
