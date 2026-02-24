/**
 * Image Compressor Service — Issue #224
 *
 * Resizes and compresses images for report generation.
 * - Max dimensions: 1200x900
 * - Max file size: 1MB
 * - Output: progressive JPEG at 80% quality
 * - Handles missing images with a placeholder
 */

import sharp from 'sharp';
import { readFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeBytes?: number;
}

export interface CompressResult {
  buffer: Buffer;
  width: number;
  height: number;
  size: number;
  format: string;
  isPlaceholder: boolean;
}

export interface BatchResult {
  results: CompressResult[];
  warnings: string[];
}

// ──────────────────────────────────────────────────────────────────────────────
// Defaults
// ──────────────────────────────────────────────────────────────────────────────

const DEFAULT_MAX_WIDTH = 1200;
const DEFAULT_MAX_HEIGHT = 900;
const DEFAULT_QUALITY = 80;
const DEFAULT_MAX_SIZE_BYTES = 1_048_576; // 1MB

// ──────────────────────────────────────────────────────────────────────────────
// Placeholder
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Generate a simple grey placeholder image with "Image Not Available" text.
 */
export async function generatePlaceholder(
  width: number = 400,
  height: number = 300,
): Promise<Buffer> {
  // Create a grey image with SVG text overlay
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#E0E0E0"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
            font-family="Arial, sans-serif" font-size="18" fill="#888888">
        Image Not Available
      </text>
    </svg>`;

  return sharp(Buffer.from(svg))
    .jpeg({ quality: 80, progressive: true })
    .toBuffer();
}

// ──────────────────────────────────────────────────────────────────────────────
// Core compression
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Compress an image buffer to progressive JPEG within size and dimension constraints.
 *
 * If the output exceeds maxSizeBytes after initial compression, quality is
 * iteratively reduced (down to 40%) until the constraint is met.
 */
export async function compressImage(
  input: Buffer,
  options: CompressOptions = {},
): Promise<CompressResult> {
  const maxWidth = options.maxWidth ?? DEFAULT_MAX_WIDTH;
  const maxHeight = options.maxHeight ?? DEFAULT_MAX_HEIGHT;
  let quality = options.quality ?? DEFAULT_QUALITY;
  const maxSizeBytes = options.maxSizeBytes ?? DEFAULT_MAX_SIZE_BYTES;

  let pipeline = sharp(input)
    .resize(maxWidth, maxHeight, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality, progressive: true });

  let buffer = await pipeline.toBuffer();

  // Iteratively reduce quality if over size limit
  while (buffer.length > maxSizeBytes && quality > 40) {
    quality -= 10;
    pipeline = sharp(input)
      .resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality, progressive: true });
    buffer = await pipeline.toBuffer();
  }

  const metadata = await sharp(buffer).metadata();

  return {
    buffer,
    width: metadata.width ?? 0,
    height: metadata.height ?? 0,
    size: buffer.length,
    format: 'jpeg',
    isPlaceholder: false,
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// File-based compression
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Compress an image from a file path. Returns a placeholder if the file is missing.
 */
export async function compressImageFromFile(
  filePath: string,
  options: CompressOptions = {},
): Promise<{ result: CompressResult; warning?: string }> {
  try {
    await access(filePath, constants.R_OK);
    const input = await readFile(filePath);
    const result = await compressImage(input, options);
    return { result };
  } catch {
    const placeholder = await generatePlaceholder();
    const metadata = await sharp(placeholder).metadata();
    return {
      result: {
        buffer: placeholder,
        width: metadata.width ?? 400,
        height: metadata.height ?? 300,
        size: placeholder.length,
        format: 'jpeg',
        isPlaceholder: true,
      },
      warning: `Missing image: ${filePath} — replaced with placeholder`,
    };
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Batch processing
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Process multiple images in sequence.
 * Missing images produce warnings and placeholders instead of errors.
 */
export async function compressImageBatch(
  filePaths: string[],
  options: CompressOptions = {},
): Promise<BatchResult> {
  const results: CompressResult[] = [];
  const warnings: string[] = [];

  for (const filePath of filePaths) {
    const { result, warning } = await compressImageFromFile(filePath, options);
    results.push(result);
    if (warning) {
      warnings.push(warning);
    }
  }

  return { results, warnings };
}
