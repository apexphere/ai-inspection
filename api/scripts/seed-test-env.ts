/**
 * Seed script for test environment
 * 
 * Run manually against Railway:
 *   railway run npx tsx scripts/seed-test-env.ts
 * 
 * Or locally with DATABASE_URL:
 *   DATABASE_URL="postgresql://..." npx tsx scripts/seed-test-env.ts
 * 
 * Required env vars:
 *   - DATABASE_URL: Postgres connection string
 *   - TEST_PASSWORD: Password for test user (or uses default for non-prod)
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const TEST_EMAIL = 'test@example.com';
const DEFAULT_TEST_PASSWORD = 'testpassword123'; // Only used if TEST_PASSWORD not set

async function seedTestUser(): Promise<void> {
  const password = process.env.TEST_PASSWORD || DEFAULT_TEST_PASSWORD;
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email: TEST_EMAIL },
    create: {
      email: TEST_EMAIL,
      passwordHash,
    },
    update: {
      passwordHash,
    },
  });

  console.log(`✅ Test user ready: ${TEST_EMAIL} (id: ${user.id})`);
}

async function seedTestProject(): Promise<void> {
  // Check if test project exists
  const existing = await prisma.project.findFirst({
    where: { name: 'Test Project' },
  });

  if (existing) {
    console.log(`✅ Test project exists: ${existing.name} (id: ${existing.id})`);
    return;
  }

  // Get test user
  const user = await prisma.user.findUnique({
    where: { email: TEST_EMAIL },
  });

  if (!user) {
    console.log('⚠️  Test user not found, skipping project creation');
    return;
  }

  // Create test client
  const client = await prisma.client.upsert({
    where: { email: 'testclient@example.com' },
    create: {
      name: 'Test Client',
      email: 'testclient@example.com',
      phone: '021-555-0123',
    },
    update: {},
  });

  // Create test property
  const property = await prisma.property.create({
    data: {
      address: '123 Test Street',
      suburb: 'Testville',
      city: 'Auckland',
      postcode: '1010',
      propertyType: 'RESIDENTIAL',
      clientId: client.id,
    },
  });

  // Create test project
  const project = await prisma.project.create({
    data: {
      name: 'Test Project',
      status: 'ACTIVE',
      propertyId: property.id,
      clientId: client.id,
      createdById: user.id,
    },
  });

  console.log(`✅ Test project created: ${project.name} (id: ${project.id})`);
}

async function main(): Promise<void> {
  console.log('');
  console.log('🌱 Seeding test environment...');
  console.log('');

  await seedTestUser();
  await seedTestProject();

  console.log('');
  console.log('✅ Test environment seeding complete!');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
