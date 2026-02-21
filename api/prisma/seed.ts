import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';
import bcrypt from 'bcrypt';

// Use cwd for paths - works with both tsx and compiled JS since railway.toml runs from api/
const seedDataDir = join(process.cwd(), 'prisma', 'seed');
const prisma = new PrismaClient();

interface BuildingCodeClauseData {
  code: string;
  title: string;
  category: string;
  objective?: string;
  performanceText: string;
  durabilityPeriod?: string | null;
  typicalEvidence?: string[];
  sortOrder: number;
}

interface NAReasonTemplateData {
  template: string;
  usage?: string;
  sortOrder: number;
}

async function seedBuildingCodeClauses() {
  // Check if already seeded
  const existing = await prisma.buildingCodeClause.findFirst();
  if (existing) {
    console.log('✓ Building Code clauses already seeded');
    return;
  }

  // Load data from JSON
  const clausesPath = join(seedDataDir, 'building-code-clauses.json');
  const clauses: BuildingCodeClauseData[] = JSON.parse(readFileSync(clausesPath, 'utf-8'));

  // Insert clauses
  for (const clause of clauses) {
    await prisma.buildingCodeClause.create({
      data: {
        code: clause.code,
        title: clause.title,
        category: clause.category as 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H',
        objective: clause.objective,
        performanceText: clause.performanceText,
        durabilityPeriod: clause.durabilityPeriod as 'FIFTY_YEARS' | 'FIFTEEN_YEARS' | 'FIVE_YEARS' | 'NA' | null,
        typicalEvidence: clause.typicalEvidence || [],
        sortOrder: clause.sortOrder,
      },
    });
  }

  console.log(`✓ Seeded ${clauses.length} Building Code clauses`);
}

async function seedNAReasonTemplates() {
  // Check if already seeded
  const existing = await prisma.nAReasonTemplate.findFirst();
  if (existing) {
    console.log('✓ N/A reason templates already seeded');
    return;
  }

  // Load data from JSON
  const templatesPath = join(seedDataDir, 'na-reason-templates.json');
  const templates: NAReasonTemplateData[] = JSON.parse(readFileSync(templatesPath, 'utf-8'));

  // Insert templates
  await prisma.nAReasonTemplate.createMany({
    data: templates.map(t => ({
      template: t.template,
      usage: t.usage,
      sortOrder: t.sortOrder,
    })),
  });

  console.log(`✓ Seeded ${templates.length} N/A reason templates`);
}

/**
 * Seed test user for E2E tests — Issue #275
 * 
 * Creates a test user with email 'test@example.com' using TEST_PASSWORD env var.
 * Both the deployed API and E2E tests must use the same TEST_PASSWORD.
 */
async function seedTestUser() {
  const testPassword = process.env.TEST_PASSWORD;
  
  if (!testPassword) {
    console.log('⚠ TEST_PASSWORD not set, skipping test user creation');
    return;
  }

  const testEmail = 'test@example.com';
  const passwordHash = await bcrypt.hash(testPassword, 12);

  await prisma.user.upsert({
    where: { email: testEmail },
    create: {
      email: testEmail,
      passwordHash,
    },
    update: {
      passwordHash,
    },
  });

  console.log(`✓ Test user created/updated: ${testEmail}`);
}

async function seedTestData() {
  // Check if already seeded
  const existing = await prisma.inspection.findFirst();
  if (existing) {
    console.log('✓ Test data already seeded');
    return;
  }

  // Create test inspection
  const inspection = await prisma.inspection.create({
    data: {
      address: '123 Test Street, Auckland',
      clientName: 'Test Client',
      inspectorName: 'Test Inspector',
      checklistId: 'standard-checklist',
      status: 'IN_PROGRESS',
      currentSection: 'exterior',
      metadata: { type: 'residential' },
    },
  });

  // Create test findings
  await prisma.finding.createMany({
    data: [
      {
        inspectionId: inspection.id,
        section: 'exterior',
        text: 'Cracks observed in exterior cladding near window frames',
        severity: 'MAJOR',
        matchedComment: 'Weather tightness issue',
      },
      {
        inspectionId: inspection.id,
        section: 'exterior',
        text: 'Minor paint peeling on fascia boards',
        severity: 'MINOR',
      },
      {
        inspectionId: inspection.id,
        section: 'interior',
        text: 'Water staining on ceiling in master bedroom',
        severity: 'MAJOR',
        matchedComment: 'Possible roof leak',
      },
      {
        inspectionId: inspection.id,
        section: 'subfloor',
        text: 'Subfloor ventilation adequate',
        severity: 'INFO',
      },
    ],
  });

  console.log(`✓ Created test inspection: ${inspection.id}`);
  console.log('✓ Created 4 test findings');
}

async function main() {
  console.log('🌱 Seeding database...');
  console.log('');

  // Seed Building Code reference data (required for production)
  await seedBuildingCodeClauses();
  await seedNAReasonTemplates();

  // Seed test user for E2E tests (if TEST_PASSWORD is set)
  await seedTestUser();

  // Seed test data (for development)
  if (process.env.NODE_ENV !== 'production') {
    await seedTestData();
  }

  console.log('');
  console.log('🌱 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
