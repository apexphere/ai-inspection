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
import * as bcrypt from 'bcrypt';

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
  // Check if test project exists by job number
  const testJobNumber = 'TEST-001';
  const existing = await prisma.project.findUnique({
    where: { jobNumber: testJobNumber },
  });

  if (existing) {
    console.log(`✅ Test project exists: ${testJobNumber} (id: ${existing.id})`);
    return;
  }

  // Create test client
  let client = await prisma.client.findFirst({
    where: { name: 'Test Client' },
  });

  if (!client) {
    client = await prisma.client.create({
      data: {
        name: 'Test Client',
        email: 'testclient@example.com',
        phone: '021-555-0123',
      },
    });
    console.log(`✅ Test client created: ${client.name} (id: ${client.id})`);
  } else {
    console.log(`✅ Test client exists: ${client.name} (id: ${client.id})`);
  }

  // Create test property
  let property = await prisma.property.findFirst({
    where: { streetAddress: '123 Test Street' },
  });

  if (!property) {
    property = await prisma.property.create({
      data: {
        streetAddress: '123 Test Street',
        suburb: 'Testville',
        city: 'Auckland',
        postcode: '1010',
        territorialAuthority: 'AKL',
      },
    });
    console.log(`✅ Test property created: ${property.streetAddress} (id: ${property.id})`);
  } else {
    console.log(`✅ Test property exists: ${property.streetAddress} (id: ${property.id})`);
  }

  // Create test project
  const project = await prisma.project.create({
    data: {
      jobNumber: testJobNumber,
      activity: 'Test Inspection',
      reportType: 'COA',
      status: 'DRAFT',
      propertyId: property.id,
      clientId: client.id,
    },
  });

  console.log(`✅ Test project created: ${testJobNumber} (id: ${project.id})`);
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
