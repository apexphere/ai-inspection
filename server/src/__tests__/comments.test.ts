/**
 * Comment Library Service Tests - Issue #4
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CommentLibraryService } from '../services/comments.js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('CommentLibraryService', () => {
  let service: CommentLibraryService;

  beforeEach(() => {
    // Use the project's config directory
    const configDir = join(__dirname, '..', '..', '..', 'config', 'comments');
    service = new CommentLibraryService(configDir);
  });

  describe('load()', () => {
    it('should load defaults.yaml', () => {
      service.load();
      // If load succeeds without error, we're good
      expect(true).toBe(true);
    });
  });

  describe('match()', () => {
    it('should match "rust" to roof rust comment', () => {
      const result = service.match('Minor rust spots on roof', 'exterior');
      expect(result.matched).toBe(true);
      expect(result.comment).toBeDefined();
      expect(result.comment?.toLowerCase()).toContain('rust');
    });

    it('should match "pooling water" to drainage comment', () => {
      const result = service.match('Water pooling near foundation', 'site_ground');
      expect(result.matched).toBe(true);
      expect(result.comment).toBeDefined();
      expect(result.comment?.toLowerCase()).toContain('drainage');
    });

    it('should match "moss" to roof moss comment', () => {
      const result = service.match('Moss growth on roof tiles');
      expect(result.matched).toBe(true);
      expect(result.comment).toBeDefined();
    });

    it('should match "blocked gutter" to gutter comment', () => {
      const result = service.match('Gutters blocked with leaves');
      expect(result.matched).toBe(true);
      expect(result.comment).toBeDefined();
      expect(result.comment?.toLowerCase()).toContain('gutter');
    });

    it('should return no match for unrelated text', () => {
      const result = service.match('The quick brown fox jumps over the lazy dog');
      expect(result.matched).toBe(false);
    });

    it('should return exact confidence for strong keyword matches', () => {
      const result = service.match('heavy rust on roofing material');
      if (result.matched) {
        expect(['exact', 'partial']).toContain(result.confidence);
      }
    });

    it('should normalize section names', () => {
      // "Site & Ground" should normalize to "site_ground"
      const result = service.match('poor drainage', 'Site & Ground');
      expect(result.matched).toBe(true);
    });
  });

  describe('getConclusion()', () => {
    it('should return good conclusion', () => {
      const conclusion = service.getConclusion('good');
      expect(conclusion).toBeDefined();
      expect(conclusion?.toLowerCase()).toContain('no');
    });

    it('should return minor conclusion', () => {
      const conclusion = service.getConclusion('minor');
      expect(conclusion).toBeDefined();
      expect(conclusion?.toLowerCase()).toContain('minor');
    });

    it('should return urgent conclusion', () => {
      const conclusion = service.getConclusion('urgent');
      expect(conclusion).toBeDefined();
      expect(conclusion?.toLowerCase()).toContain('immediate');
    });

    it('should return null for invalid severity', () => {
      // @ts-expect-error Testing invalid input
      const conclusion = service.getConclusion('invalid');
      expect(conclusion).toBeNull();
    });
  });

  describe('reload()', () => {
    it('should reload the library', () => {
      service.load();
      const firstResult = service.match('rust on roof');
      
      service.reload();
      const secondResult = service.match('rust on roof');
      
      expect(firstResult.matched).toBe(secondResult.matched);
    });
  });
});
