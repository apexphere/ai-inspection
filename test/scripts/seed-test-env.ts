/**
 * Seed script for test environment
 * 
 * Run from test/ directory:
 *   npm run seed                    # local with .env
 *   npm run seed:railway            # via Railway CLI
 * 
 * Or with explicit DATABASE_URL:
 *   DATABASE_URL="postgresql://..." npm run seed
 * 
 * Required env vars:
 *   - DATABASE_URL: Postgres connection string
 *   - TEST_PASSWORD: Password for test user (or uses default for non-prod)
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import * as path from 'node:path';

const prisma = new PrismaClient();

const TEST_EMAIL = 'test@example.com';
const DEFAULT_TEST_PASSWORD = 'testpassword123'; // Only used if TEST_PASSWORD not set

async function seedTestUser(): Promise<void> {
  const password = process.env.TEST_PASSWORD || DEFAULT_TEST_PASSWORD;
  const passwordHash = await bcrypt.hash(password, 12);

  // Fixed UUID so ADMIN_USER_IDS in docker-compose always matches
  const TEST_USER_ID = '00000000-0000-0000-0000-000000000001';
  const user = await prisma.user.upsert({
    where: { email: TEST_EMAIL },
    create: {
      id: TEST_USER_ID,
      email: TEST_EMAIL,
      passwordHash,
    },
    update: {
      passwordHash,
    },
  });

  console.log(`✅ Test user ready: ${TEST_EMAIL} (id: ${user.id})`);
}


const FLOORPLAN_IMAGE_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

function resolveUploadDir(): string {
  if (process.env.UPLOAD_DIR) return process.env.UPLOAD_DIR;
  const dockerPath = '/app/data/uploads';
  if (existsSync(dockerPath)) {
    return dockerPath;
  }
  return path.resolve(process.cwd(), '../data/uploads');
}

async function ensureFloorPlanForProject(projectId: string): Promise<void> {
  const existingPhoto = await prisma.projectPhoto.findFirst({
    where: { projectId },
    orderBy: { reportNumber: 'asc' },
  });

  let projectPhotoId = existingPhoto?.id;

  if (!existingPhoto) {
    const uploadDir = resolveUploadDir();
    const projectDir = path.join(uploadDir, 'photos', projectId);
    await fs.mkdir(projectDir, { recursive: true });

    const fileName = 'floor-plan-test.jpg';
    const thumbName = 'floor-plan-test_thumb.jpg';
    const filePath = path.join(projectDir, fileName);
    const thumbPath = path.join(projectDir, thumbName);
    const buffer = Buffer.from(FLOORPLAN_IMAGE_BASE64, 'base64');

    await fs.writeFile(filePath, buffer);
    await fs.writeFile(thumbPath, buffer);

    const relativeFilePath = path.join('photos', projectId, fileName);
    const relativeThumbPath = path.join('photos', projectId, thumbName);

    const createdPhoto = await prisma.projectPhoto.create({
      data: {
        projectId,
        reportNumber: 1,
        sortOrder: 0,
        filePath: relativeFilePath,
        thumbnailPath: relativeThumbPath,
        mimeType: 'image/jpeg',
        fileSize: buffer.length,
        caption: 'Floor Plan',
        source: 'OWNER',
        linkedClauses: [],
      },
    });

    projectPhotoId = createdPhoto.id;
  }

  const existingFloorPlan = await prisma.floorPlan.findFirst({
    where: { projectId },
    orderBy: { floor: 'asc' },
  });

  if (!existingFloorPlan) {
    await prisma.floorPlan.create({
      data: {
        projectId,
        floor: 1,
        label: 'Ground Floor',
        rooms: ['Living', 'Kitchen'],
        photoIds: projectPhotoId ? [projectPhotoId] : [],
      },
    });
  } else if (projectPhotoId && existingFloorPlan.photoIds.length === 0) {
    await prisma.floorPlan.update({
      where: { id: existingFloorPlan.id },
      data: { photoIds: [projectPhotoId] },
    });
  }
}

async function seedTestProject(): Promise<void> {
  // Check if test project exists by job number
  const testJobNumber = 'TEST-001';
  const existing = await prisma.project.findUnique({
    where: { jobNumber: testJobNumber },
  });

  if (existing) {
    console.log(`✅ Test project exists: ${testJobNumber} (id: ${existing.id})`);
    await ensureFloorPlanForProject(existing.id);
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
  await ensureFloorPlanForProject(project.id);
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
