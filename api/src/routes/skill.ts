/**
 * Skill Bundle API
 *
 * Allows agents to discover and download the current skill version,
 * so they stay in sync with the API they're talking to.
 *
 * GET /api/skill/version  — public, lightweight version + checksum check
 * GET /api/skill/bundle   — service auth required, full file bundle
 */

import { Router, type Router as RouterType, type Request, type Response } from 'express';
import { readFileSync, existsSync } from 'fs';
import { resolve, join } from 'path';
import { createHash } from 'crypto';
import { serviceAuthMiddleware } from '../middleware/auth.js';

export const skillRouter: RouterType = Router();

// Skill directory is at the repo root: <repo>/skill/
// In production (Docker), SKILL_DIR env var can override.
const SKILL_DIR = process.env.SKILL_DIR
  ? resolve(process.env.SKILL_DIR)
  : resolve(new URL('../../../..', import.meta.url).pathname, 'skill');

const MANIFEST_PATH = join(SKILL_DIR, 'manifest.json');

interface SkillManifest {
  version: string;
  name: string;
  description: string;
  files: string[];
  updatedAt: string;
}

function loadManifest(): SkillManifest {
  if (!existsSync(MANIFEST_PATH)) {
    throw new Error(`Skill manifest not found at ${MANIFEST_PATH}`);
  }
  return JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) as SkillManifest;
}

function sha256(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

function buildBundle(manifest: SkillManifest): Record<string, string> {
  const files: Record<string, string> = {};
  for (const filename of manifest.files) {
    const filePath = join(SKILL_DIR, filename);
    if (!existsSync(filePath)) {
      throw new Error(`Skill file not found: ${filename}`);
    }
    files[filename] = readFileSync(filePath, 'utf8');
  }
  return files;
}

function buildChecksum(manifest: SkillManifest, files: Record<string, string>): string {
  // Deterministic checksum over all file contents, sorted by filename
  const combined = manifest.files
    .slice()
    .sort()
    .map((f) => `${f}:${sha256(files[f])}`)
    .join('\n');
  return sha256(combined);
}

/**
 * GET /api/skill/version
 * Public — lightweight poll endpoint for agents to check if their skill is current.
 */
skillRouter.get('/version', (_req: Request, res: Response): void => {
  try {
    const manifest = loadManifest();
    const files = buildBundle(manifest);
    const checksum = buildChecksum(manifest, files);

    res.json({
      version: manifest.version,
      name: manifest.name,
      checksum,
      updatedAt: manifest.updatedAt,
    });
  } catch (err) {
    console.error('[skill] Failed to load skill version:', err);
    res.status(500).json({ error: 'Failed to load skill manifest' });
  }
});

/**
 * GET /api/skill/bundle
 * Service auth required — returns full skill file bundle for download.
 *
 * Agents should:
 *   1. Poll /api/skill/version to check the checksum
 *   2. If changed, call this endpoint to fetch updated files
 *   3. Write files to their skill directory and restart
 */
skillRouter.get('/bundle', serviceAuthMiddleware, (_req: Request, res: Response): void => {
  try {
    const manifest = loadManifest();
    const files = buildBundle(manifest);
    const checksum = buildChecksum(manifest, files);

    res.json({
      version: manifest.version,
      name: manifest.name,
      description: manifest.description,
      checksum,
      updatedAt: manifest.updatedAt,
      files,
    });
  } catch (err) {
    console.error('[skill] Failed to build skill bundle:', err);
    res.status(500).json({ error: 'Failed to build skill bundle' });
  }
});
