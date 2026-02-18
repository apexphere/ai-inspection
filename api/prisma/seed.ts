import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Check if already seeded
  const existing = await prisma.inspection.findFirst();
  if (existing) {
    console.log('✓ Database already seeded');
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

  console.log(`✓ Created inspection: ${inspection.id}`);
  console.log('✓ Created 4 findings');
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
