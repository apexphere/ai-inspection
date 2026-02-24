/**
 * Seed Default Report Templates — Issue #209
 *
 * Idempotent: uses upsert on (name + type + version) to avoid duplicates.
 * Run: npx tsx api/prisma/seed-templates.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface TemplateSeed {
  name: string;
  type: 'SECTION' | 'BOILERPLATE' | 'METHODOLOGY';
  reportType?: 'COA' | 'CCC_GAP' | 'PPI' | 'SAFE_SANITARY' | 'TFA';
  content: string;
  variables: string[];
}

const DEFAULT_TEMPLATES: TemplateSeed[] = [
  // ── COA Section Templates ──────────────────────────────────────────────
  {
    name: 'Introduction - COA',
    type: 'SECTION',
    reportType: 'COA',
    content: `[Company Name] have been engaged to carry out an independent assessment of the building works at [Address] to meet the performance requirements of the New Zealand Building Code.

The purpose of this inspection is to independently inspect and report on the performance against relevant clauses of the New Zealand Building Code.

The works subject to this Certificate of Acceptance application are described in the body of this report.`,
    variables: ['Company Name', 'Address'],
  },
  {
    name: 'Introduction - CCC Gap Analysis',
    type: 'SECTION',
    reportType: 'CCC_GAP',
    content: `[Company Name] have been engaged to carry out a Code Compliance Certificate Gap Analysis for the building works at [Address].

This report identifies outstanding items and inspections required to achieve a Code Compliance Certificate from [Territorial Authority].`,
    variables: ['Company Name', 'Address', 'Territorial Authority'],
  },
  {
    name: 'Introduction - PPI',
    type: 'SECTION',
    reportType: 'PPI',
    content: `[Company Name] have been engaged to carry out a Pre-Purchase Inspection of the property at [Address].

This report provides an independent assessment of the building condition at the time of inspection, intended to inform the prospective purchaser of any significant defects or maintenance issues.`,
    variables: ['Company Name', 'Address'],
  },
  {
    name: 'Introduction - Safe & Sanitary',
    type: 'SECTION',
    reportType: 'SAFE_SANITARY',
    content: `[Company Name] have been engaged to carry out a Safe and Sanitary assessment of the building at [Address].

This report assesses whether the building meets the minimum requirements for safe and sanitary conditions under Section 112 of the Building Act 2004.`,
    variables: ['Company Name', 'Address'],
  },

  // ── CCC Gap Analysis Section Templates (#221) ──────────────────────────
  {
    name: 'Executive Summary - CCC Gap Analysis',
    type: 'SECTION',
    reportType: 'CCC_GAP',
    content: `This CCC Gap Analysis report has been prepared for [Client Name] in respect of the building at [Address].

The inspection identified the following key findings:

**Defects Identified:**
[Defect List]

**Breached Building Code Clauses:**
[Breached Clauses]

**Remediation Summary:**
[Remediation Summary]

**Estimated Remediation Cost (excl. GST):**
[Cost Estimate]`,
    variables: ['Client Name', 'Address', 'Defect List', 'Breached Clauses', 'Remediation Summary', 'Cost Estimate'],
  },
  {
    name: 'Defect Schedule - CCC Gap Analysis',
    type: 'SECTION',
    reportType: 'CCC_GAP',
    content: `The following defect schedule details all items identified during the inspection that require remediation prior to achieving a Code Compliance Certificate.

| # | Location | Element | Description | Clause | Priority | Remedial Action |
|---|----------|---------|-------------|--------|----------|-----------------|
[Defect List]

Total defects identified: [Defect Count]`,
    variables: ['Defect List', 'Defect Count'],
  },
  {
    name: 'Moisture Reading Summary - CCC Gap Analysis',
    type: 'SECTION',
    reportType: 'CCC_GAP',
    content: `Non-invasive moisture testing was carried out at locations identified as high-risk for moisture ingress. The following table summarises the readings obtained.

[Moisture Summary]

**Interpretation:**
- Acceptable: < 18% — within normal range
- Marginal: 18–25% — monitoring recommended
- Unacceptable: > 25% — further investigation required

Any unacceptable readings have been cross-referenced to the Defect Schedule above.`,
    variables: ['Moisture Summary'],
  },
  {
    name: 'Cost Estimate Summary - CCC Gap Analysis',
    type: 'SECTION',
    reportType: 'CCC_GAP',
    content: `The following cost estimate provides an indicative budget for the remediation works identified in this report. Costs are estimates only and should be confirmed by obtaining competitive quotations from suitably qualified contractors.

[Cost Estimate]

**Notes:**
- All costs are exclusive of GST
- A contingency allowance has been included
- Actual costs may vary depending on site conditions and contractor availability
- Costs do not include professional fees, consenting fees, or council charges`,
    variables: ['Cost Estimate'],
  },

  // ── Methodology Templates ─────────────────────────────────────────────
  {
    name: 'Methodology - Standard',
    type: 'METHODOLOGY',
    content: `In the process of the assessment, photographs were taken during the site inspection. Relevant documents provided by the client were used as references to assess the building works. The floor plans retrieved from the [Territorial Authority] property file are also used as a reference to assess the building works.

The inspection was carried out on [Inspection Date] by [Inspector Name]. Weather conditions at the time of inspection were [Weather].

The assessment included a visual inspection of the building elements accessible at the time of inspection. No invasive testing was carried out unless otherwise stated in this report.`,
    variables: ['Territorial Authority', 'Inspection Date', 'Inspector Name', 'Weather'],
  },
  {
    name: 'Methodology - Moisture Testing',
    type: 'METHODOLOGY',
    content: `In addition to the visual inspection, non-invasive moisture testing was carried out using a Tramex Moisture Encounter Plus meter. Readings were taken at locations identified as high-risk for moisture ingress.

Moisture readings above 18% are considered marginal, and readings above 25% are considered unacceptable and may indicate active moisture ingress requiring further investigation.`,
    variables: [],
  },

  // ── Boilerplate Templates ─────────────────────────────────────────────
  {
    name: 'Limitations - Standard',
    type: 'BOILERPLATE',
    content: `This report has been prepared for the client by [Company Name] under a specific scope and Terms of Engagement. The report is based on our observations from a visual survey of the building visible at the time of inspection.

The conclusions and recommendations are in general terms only and are intended to provide a guide to achieving a [Report Type].

All recommendations within the scope of works identified in this report must be completed strictly in accordance with the New Zealand Building Code and manufacturer's technical instructions and must be signed off by [Company Name] on completion of the works.

Subject to the above, [Company Name] believes that on reasonable grounds the works will comply with the relevant provisions of the New Zealand Building Code.`,
    variables: ['Company Name', 'Report Type'],
  },
  {
    name: 'Disclaimer - Standard',
    type: 'BOILERPLATE',
    content: `This report has been prepared solely for the use of [Client Name] and may not be relied upon by any third party without the prior written consent of [Company Name].

The inspection was limited to a visual assessment of readily accessible areas. Concealed defects, if any, may exist that were not identified during the inspection. [Company Name] accepts no liability for defects not reasonably discoverable at the time of inspection.

This report does not constitute a guarantee or warranty regarding the condition of the building.`,
    variables: ['Client Name', 'Company Name'],
  },
  {
    name: 'Scope of Works - COA',
    type: 'BOILERPLATE',
    reportType: 'COA',
    content: `The scope of this report covers the assessment of building works carried out at [Address] for the purpose of obtaining a Certificate of Acceptance under Section 96 of the Building Act 2004.

The assessment covers compliance with the relevant clauses of the New Zealand Building Code as detailed in the Clause Review section of this report.

This report does not cover any works outside the scope of the Certificate of Acceptance application.`,
    variables: ['Address'],
  },
  {
    name: 'Document Control',
    type: 'BOILERPLATE',
    content: `Report prepared by: [Author Name], [Author Credentials]
Report reviewed by: [Reviewer Name], [Reviewer Credentials]
Job Number: [Job Number]
Date: [Inspection Date]`,
    variables: ['Author Name', 'Author Credentials', 'Reviewer Name', 'Reviewer Credentials', 'Job Number', 'Inspection Date'],
  },
];

async function seed(): Promise<void> {
  console.log('🌱 Seeding default report templates...');

  let created = 0;
  let skipped = 0;

  for (const template of DEFAULT_TEMPLATES) {
    // Check if template already exists (idempotent)
    const existing = await prisma.reportTemplate.findFirst({
      where: {
        name: template.name,
        type: template.type,
        version: 1,
      },
    });

    if (existing) {
      skipped++;
      console.log(`  ⏭️  ${template.name} (already exists)`);
      continue;
    }

    await prisma.reportTemplate.create({
      data: {
        name: template.name,
        type: template.type,
        reportType: template.reportType ?? null,
        content: template.content,
        variables: template.variables,
        version: 1,
        isDefault: true,
        isActive: true,
      },
    });

    created++;
    console.log(`  ✅ ${template.name}`);
  }

  console.log(`\n🌱 Done: ${created} created, ${skipped} skipped`);
}

seed()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
