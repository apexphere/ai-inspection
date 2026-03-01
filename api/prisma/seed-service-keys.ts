/**
 * Seed Service Keys — Issue #594
 *
 * Seeds Kai's service key using the current SERVICE_API_KEY value.
 * Run: npx tsx prisma/seed-service-keys.ts
 */

import { PrismaClient } from '@prisma/client';
import { ServiceKeyService } from '../src/services/service-key.js';

const prisma = new PrismaClient();
const svc = new ServiceKeyService(prisma);

const KAI_SCOPES = [
  'inspections:*',
  'projects:*',
  'properties:*',
  'clients:*',
  'checklist:*',
  'clause-reviews:*',
  'building-code:read',
  'photos:*',
];

async function main() {
  const rawKey = process.env.SERVICE_API_KEY;
  if (!rawKey) {
    console.error('SERVICE_API_KEY env var is required');
    process.exit(1);
  }

  // Check if already seeded
  const existing = await prisma.serviceKey.findUnique({
    where: { name: 'kai-agent' },
  });

  if (existing) {
    console.log('Kai service key already exists, skipping.');
    return;
  }

  const key = await svc.create({
    name: 'kai-agent',
    rawKey,
    scopes: KAI_SCOPES,
    actor: 'agent:kai',
  });

  console.log(`Created service key: ${key.name} (prefix: ${key.keyPrefix})`);
  console.log(`Scopes: ${key.scopes.join(', ')}`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
