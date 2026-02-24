/**
 * Image Compressor Tests — Issue #224
 */

import { describe, it, expect } from 'vitest';
import sharp from 'sharp';
import {
  compressImage,
  compressImageFromFile,
  compressImageBatch,
  generatePlaceholder,
} from '../services/image-compressor.js';

// Helper: create a test image buffer
async function createTestImage(
  width: number,
  height: number,
  format: 'jpeg' | 'png' = 'jpeg',
): Promise<Buffer> {
  const base = sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 255, g: 0, b: 0 },
    },
  });
  return format === 'png' ? base.png().toBuffer() : base.jpeg({ quality: 100 }).toBuffer();
}

describe('image-compressor', () => {
  describe('compressImage', () => {
    it('resizes images exceeding max dimensions', async () => {
      const input = await createTestImage(2400, 1800);
      const result = await compressImage(input);

      expect(result.width).toBeLessThanOrEqual(1200);
      expect(result.height).toBeLessThanOrEqual(900);
      expect(result.format).toBe('jpeg');
      expect(result.isPlaceholder).toBe(false);
    });

    it('does not enlarge small images', async () => {
      const input = await createTestImage(400, 300);
      const result = await compressImage(input);

      expect(result.width).toBeLessThanOrEqual(400);
      expect(result.height).toBeLessThanOrEqual(300);
    });

    it('maintains aspect ratio', async () => {
      const input = await createTestImage(2400, 1200); // 2:1 ratio
      const result = await compressImage(input);

      const ratio = result.width / result.height;
      expect(ratio).toBeCloseTo(2, 0);
    });

    it('outputs progressive JPEG', async () => {
      const input = await createTestImage(800, 600);
      const result = await compressImage(input);
      const metadata = await sharp(result.buffer).metadata();

      expect(metadata.format).toBe('jpeg');
      expect(metadata.isProgressive).toBe(true);
    });

    it('handles PNG input', async () => {
      const input = await createTestImage(800, 600, 'png');
      const result = await compressImage(input);

      expect(result.format).toBe('jpeg');
      expect(result.width).toBeLessThanOrEqual(800);
    });

    it('respects custom max dimensions', async () => {
      const input = await createTestImage(2000, 2000);
      const result = await compressImage(input, { maxWidth: 600, maxHeight: 600 });

      expect(result.width).toBeLessThanOrEqual(600);
      expect(result.height).toBeLessThanOrEqual(600);
    });

    it('output size is reported correctly', async () => {
      const input = await createTestImage(800, 600);
      const result = await compressImage(input);

      expect(result.size).toBe(result.buffer.length);
      expect(result.size).toBeGreaterThan(0);
    });
  });

  describe('generatePlaceholder', () => {
    it('generates a valid JPEG image', async () => {
      const buffer = await generatePlaceholder();
      const metadata = await sharp(buffer).metadata();

      expect(metadata.format).toBe('jpeg');
      expect(metadata.width).toBe(400);
      expect(metadata.height).toBe(300);
    });

    it('accepts custom dimensions', async () => {
      const buffer = await generatePlaceholder(800, 600);
      const metadata = await sharp(buffer).metadata();

      expect(metadata.width).toBe(800);
      expect(metadata.height).toBe(600);
    });
  });

  describe('compressImageFromFile', () => {
    it('returns placeholder for missing file', async () => {
      const { result, warning } = await compressImageFromFile('/nonexistent/image.jpg');

      expect(result.isPlaceholder).toBe(true);
      expect(result.format).toBe('jpeg');
      expect(warning).toContain('Missing image');
      expect(warning).toContain('/nonexistent/image.jpg');
    });
  });

  describe('compressImageBatch', () => {
    it('handles batch of missing files with warnings', async () => {
      const paths = ['/missing/a.jpg', '/missing/b.jpg'];
      const { results, warnings } = await compressImageBatch(paths);

      expect(results).toHaveLength(2);
      expect(results.every(r => r.isPlaceholder)).toBe(true);
      expect(warnings).toHaveLength(2);
    });

    it('returns empty results for empty input', async () => {
      const { results, warnings } = await compressImageBatch([]);

      expect(results).toHaveLength(0);
      expect(warnings).toHaveLength(0);
    });
  });
});
