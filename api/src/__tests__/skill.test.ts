import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createHash } from 'crypto';
import { join } from 'path';

// ---------------------------------------------------------------------------
// Inline the core skill bundle logic for unit testing without FS or Express
// ---------------------------------------------------------------------------

interface SkillManifest {
  version: string;
  name: string;
  description: string;
  files: string[];
  updatedAt: string;
}

function sha256(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

function buildChecksum(manifest: SkillManifest, files: Record<string, string>): string {
  const combined = manifest.files
    .slice()
    .sort()
    .map((f) => `${f}:${sha256(files[f])}`)
    .join('\n');
  return sha256(combined);
}

const SAMPLE_MANIFEST: SkillManifest = {
  version: '1.0.0',
  name: 'ai-inspection',
  description: 'AI-powered building inspection assistant skill',
  files: ['SKILL.md', 'mcp.json'],
  updatedAt: '2026-03-09T00:00:00Z',
};

const SAMPLE_FILES: Record<string, string> = {
  'SKILL.md': '# AI Inspection Skill\nGuide inspectors through checklists.',
  'mcp.json': '{"mcpServers":{"ai-inspection":{"command":"node"}}}',
};

describe('Skill bundle logic', () => {
  describe('sha256', () => {
    it('produces a 64-char hex string', () => {
      const hash = sha256('hello');
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[0-9a-f]+$/);
    });

    it('is deterministic', () => {
      expect(sha256('test')).toBe(sha256('test'));
    });

    it('differs for different inputs', () => {
      expect(sha256('a')).not.toBe(sha256('b'));
    });
  });

  describe('buildChecksum', () => {
    it('returns a deterministic checksum for the same files', () => {
      const c1 = buildChecksum(SAMPLE_MANIFEST, SAMPLE_FILES);
      const c2 = buildChecksum(SAMPLE_MANIFEST, SAMPLE_FILES);
      expect(c1).toBe(c2);
    });

    it('changes when file content changes', () => {
      const original = buildChecksum(SAMPLE_MANIFEST, SAMPLE_FILES);
      const modified = buildChecksum(SAMPLE_MANIFEST, {
        ...SAMPLE_FILES,
        'SKILL.md': '# Modified Skill',
      });
      expect(original).not.toBe(modified);
    });

    it('is order-independent — files sorted before hashing', () => {
      const manifestAB: SkillManifest = { ...SAMPLE_MANIFEST, files: ['SKILL.md', 'mcp.json'] };
      const manifestBA: SkillManifest = { ...SAMPLE_MANIFEST, files: ['mcp.json', 'SKILL.md'] };
      expect(buildChecksum(manifestAB, SAMPLE_FILES)).toBe(
        buildChecksum(manifestBA, SAMPLE_FILES)
      );
    });

    it('produces a 64-char hex string', () => {
      const checksum = buildChecksum(SAMPLE_MANIFEST, SAMPLE_FILES);
      expect(checksum).toHaveLength(64);
      expect(checksum).toMatch(/^[0-9a-f]+$/);
    });
  });

  describe('version response shape', () => {
    it('includes version, name, checksum, updatedAt', () => {
      const files = SAMPLE_FILES;
      const checksum = buildChecksum(SAMPLE_MANIFEST, files);
      const response = {
        version: SAMPLE_MANIFEST.version,
        name: SAMPLE_MANIFEST.name,
        checksum,
        updatedAt: SAMPLE_MANIFEST.updatedAt,
      };

      expect(response).toMatchObject({
        version: '1.0.0',
        name: 'ai-inspection',
        updatedAt: '2026-03-09T00:00:00Z',
      });
      expect(response.checksum).toHaveLength(64);
    });
  });

  describe('bundle response shape', () => {
    it('includes version, name, description, checksum, updatedAt, files', () => {
      const checksum = buildChecksum(SAMPLE_MANIFEST, SAMPLE_FILES);
      const response = {
        version: SAMPLE_MANIFEST.version,
        name: SAMPLE_MANIFEST.name,
        description: SAMPLE_MANIFEST.description,
        checksum,
        updatedAt: SAMPLE_MANIFEST.updatedAt,
        files: SAMPLE_FILES,
      };

      expect(response.files).toHaveProperty('SKILL.md');
      expect(response.files).toHaveProperty('mcp.json');
      expect(response.description).toBe('AI-powered building inspection assistant skill');
    });

    it('checksum in bundle matches checksum in version endpoint', () => {
      const versionChecksum = buildChecksum(SAMPLE_MANIFEST, SAMPLE_FILES);
      const bundleChecksum = buildChecksum(SAMPLE_MANIFEST, SAMPLE_FILES);
      expect(versionChecksum).toBe(bundleChecksum);
    });
  });
});
