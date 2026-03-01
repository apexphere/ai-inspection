/**
 * Service Key Management — Issue #594
 *
 * Manages DB-backed API keys with scopes and actor identity.
 */

import type { PrismaClient, ServiceKey } from '@prisma/client';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;
const PREFIX_LENGTH = 8;

export class ServiceKeyNotFoundError extends Error {
  constructor(id: string) {
    super(`Service key not found: ${id}`);
    this.name = 'ServiceKeyNotFoundError';
  }
}

export class DuplicateKeyNameError extends Error {
  constructor(name: string) {
    super(`Service key with name "${name}" already exists`);
    this.name = 'DuplicateKeyNameError';
  }
}

export interface CreateServiceKeyInput {
  name: string;
  rawKey: string;
  scopes: string[];
  actor: string;
  expiresAt?: Date;
}

export class ServiceKeyService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a new service key (hashes the raw key).
   */
  async create(input: CreateServiceKeyInput): Promise<ServiceKey> {
    const { name, rawKey, scopes, actor, expiresAt } = input;

    const existing = await this.prisma.serviceKey.findUnique({ where: { name } });
    if (existing) {
      throw new DuplicateKeyNameError(name);
    }

    const keyHash = await bcrypt.hash(rawKey, SALT_ROUNDS);
    const keyPrefix = rawKey.slice(0, PREFIX_LENGTH);

    return this.prisma.serviceKey.create({
      data: {
        name,
        keyHash,
        keyPrefix,
        scopes,
        actor,
        expiresAt: expiresAt ?? null,
      },
    });
  }

  /**
   * Find a service key by its prefix (first 8 chars).
   * Returns null if not found.
   */
  async findByPrefix(prefix: string): Promise<ServiceKey | null> {
    return this.prisma.serviceKey.findFirst({
      where: { keyPrefix: prefix, active: true },
    });
  }

  /**
   * Verify a raw key against a stored key hash.
   */
  async verify(rawKey: string, keyHash: string): Promise<boolean> {
    return bcrypt.compare(rawKey, keyHash);
  }

  /**
   * Update lastUsedAt timestamp (fire-and-forget).
   */
  async touchLastUsed(id: string): Promise<void> {
    await this.prisma.serviceKey.update({
      where: { id },
      data: { lastUsedAt: new Date() },
    });
  }

  /**
   * List all service keys (without hashes).
   */
  async list(): Promise<Omit<ServiceKey, 'keyHash'>[]> {
    const keys = await this.prisma.serviceKey.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return keys.map(({ keyHash: _, ...rest }) => rest);
  }

  /**
   * Deactivate a key.
   */
  async deactivate(id: string): Promise<ServiceKey> {
    return this.prisma.serviceKey.update({
      where: { id },
      data: { active: false },
    });
  }

  /**
   * Regenerate a service key — Issue #609
   *
   * Archives the old key (rename + deactivate) and creates a new one
   * with the same name, actor, and scopes. Returns the new key record.
   */
  async regenerate(id: string, rawKey: string): Promise<ServiceKey> {
    const existing = await this.prisma.serviceKey.findFirst({
      where: { id, active: true },
    });

    if (!existing) {
      throw new ServiceKeyNotFoundError(id);
    }

    const keyHash = await bcrypt.hash(rawKey, SALT_ROUNDS);
    const keyPrefix = rawKey.slice(0, PREFIX_LENGTH);
    const archivedName = `${existing.name}__rotated_${Date.now()}`;

    // Rename + deactivate old key, then create new with original name
    const [, newKey] = await this.prisma.$transaction([
      this.prisma.serviceKey.update({
        where: { id },
        data: { active: false, name: archivedName },
      }),
      this.prisma.serviceKey.create({
        data: {
          name: existing.name,
          keyHash,
          keyPrefix,
          scopes: existing.scopes,
          actor: existing.actor,
          expiresAt: existing.expiresAt,
        },
      }),
    ]);

    return newKey;
  }
}
