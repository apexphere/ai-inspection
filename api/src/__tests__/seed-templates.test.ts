/**
 * Seed Templates Validation Tests — Issue #209
 *
 * Validates the template seed data integrity without requiring a database.
 */

import { describe, it, expect } from 'vitest';
import { extractVariables } from '../services/variable-substitution.js';

// Import the template data by re-defining it here (seed script is a standalone runner).
// This tests the template content structure matches what the variable substitution engine expects.

const DEFAULT_TEMPLATES = [
  {
    name: 'Introduction - COA',
    type: 'SECTION' as const,
    reportType: 'COA' as const,
    content: `[Company Name] have been engaged to carry out an independent assessment of the building works at [Address] to meet the performance requirements of the New Zealand Building Code.

The purpose of this inspection is to independently inspect and report on the performance against relevant clauses of the New Zealand Building Code.

The works subject to this Certificate of Acceptance application are described in the body of this report.`,
    variables: ['Company Name', 'Address'],
  },
  {
    name: 'Introduction - CCC Gap Analysis',
    type: 'SECTION' as const,
    reportType: 'CCC_GAP' as const,
    content: `[Company Name] have been engaged to carry out a Code Compliance Certificate Gap Analysis for the building works at [Address].

This report identifies outstanding items and inspections required to achieve a Code Compliance Certificate from [Territorial Authority].`,
    variables: ['Company Name', 'Address', 'Territorial Authority'],
  },
  // CCC Gap Analysis templates (#221)
  {
    name: 'Executive Summary - CCC Gap Analysis',
    type: 'SECTION' as const,
    reportType: 'CCC_GAP' as const,
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
    type: 'SECTION' as const,
    reportType: 'CCC_GAP' as const,
    content: `The following defect schedule details all items identified during the inspection that require remediation prior to achieving a Code Compliance Certificate.

| # | Location | Element | Description | Clause | Priority | Remedial Action |
|---|----------|---------|-------------|--------|----------|-----------------|
[Defect List]

Total defects identified: [Defect Count]`,
    variables: ['Defect List', 'Defect Count'],
  },
  {
    name: 'Moisture Reading Summary - CCC Gap Analysis',
    type: 'SECTION' as const,
    reportType: 'CCC_GAP' as const,
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
    type: 'SECTION' as const,
    reportType: 'CCC_GAP' as const,
    content: `The following cost estimate provides an indicative budget for the remediation works identified in this report. Costs are estimates only and should be confirmed by obtaining competitive quotations from suitably qualified contractors.

[Cost Estimate]

**Notes:**
- All costs are exclusive of GST
- A contingency allowance has been included
- Actual costs may vary depending on site conditions and contractor availability
- Costs do not include professional fees, consenting fees, or council charges`,
    variables: ['Cost Estimate'],
  },
  {
    name: 'Methodology - Standard',
    type: 'METHODOLOGY' as const,
    content: `In the process of the assessment, photographs were taken during the site inspection. Relevant documents provided by the client were used as references to assess the building works. The floor plans retrieved from the [Territorial Authority] property file are also used as a reference to assess the building works.

The inspection was carried out on [Inspection Date] by [Inspector Name]. Weather conditions at the time of inspection were [Weather].

The assessment included a visual inspection of the building elements accessible at the time of inspection. No invasive testing was carried out unless otherwise stated in this report.`,
    variables: ['Territorial Authority', 'Inspection Date', 'Inspector Name', 'Weather'],
  },
  {
    name: 'Limitations - Standard',
    type: 'BOILERPLATE' as const,
    content: `This report has been prepared for the client by [Company Name] under a specific scope and Terms of Engagement. The report is based on our observations from a visual survey of the building visible at the time of inspection.

The conclusions and recommendations are in general terms only and are intended to provide a guide to achieving a [Report Type].

All recommendations within the scope of works identified in this report must be completed strictly in accordance with the New Zealand Building Code and manufacturer's technical instructions and must be signed off by [Company Name] on completion of the works.

Subject to the above, [Company Name] believes that on reasonable grounds the works will comply with the relevant provisions of the New Zealand Building Code.`,
    variables: ['Company Name', 'Report Type'],
  },
  {
    name: 'Disclaimer - Standard',
    type: 'BOILERPLATE' as const,
    content: `This report has been prepared solely for the use of [Client Name] and may not be relied upon by any third party without the prior written consent of [Company Name].

The inspection was limited to a visual assessment of readily accessible areas. Concealed defects, if any, may exist that were not identified during the inspection. [Company Name] accepts no liability for defects not reasonably discoverable at the time of inspection.

This report does not constitute a guarantee or warranty regarding the condition of the building.`,
    variables: ['Client Name', 'Company Name'],
  },
  {
    name: 'Document Control',
    type: 'BOILERPLATE' as const,
    content: `Report prepared by: [Author Name], [Author Credentials]
Report reviewed by: [Reviewer Name], [Reviewer Credentials]
Job Number: [Job Number]
Date: [Inspection Date]`,
    variables: ['Author Name', 'Author Credentials', 'Reviewer Name', 'Reviewer Credentials', 'Job Number', 'Inspection Date'],
  },
];

describe('Default Report Templates (seed data)', () => {
  it('all templates have non-empty name', () => {
    for (const t of DEFAULT_TEMPLATES) {
      expect(t.name.length).toBeGreaterThan(0);
    }
  });

  it('all templates have non-empty content', () => {
    for (const t of DEFAULT_TEMPLATES) {
      expect(t.content.length).toBeGreaterThan(0);
    }
  });

  it('all templates have valid type', () => {
    const validTypes = ['SECTION', 'BOILERPLATE', 'METHODOLOGY'];
    for (const t of DEFAULT_TEMPLATES) {
      expect(validTypes).toContain(t.type);
    }
  });

  it('declared variables match variables found in content', () => {
    for (const t of DEFAULT_TEMPLATES) {
      const found = extractVariables(t.content);
      const declared = [...t.variables].sort();
      const extracted = [...found].sort();

      expect(extracted).toEqual(declared);
    }
  });

  it('no duplicate template names', () => {
    const names = DEFAULT_TEMPLATES.map((t) => t.name);
    const unique = new Set(names);
    expect(unique.size).toBe(names.length);
  });

  it('all report types are covered with introduction templates', () => {
    const introTypes = DEFAULT_TEMPLATES
      .filter((t) => t.name.startsWith('Introduction'))
      .map((t) => t.reportType);

    expect(introTypes).toContain('COA');
    expect(introTypes).toContain('CCC_GAP');
  });

  it('has at least one methodology template', () => {
    const methodologies = DEFAULT_TEMPLATES.filter((t) => t.type === 'METHODOLOGY');
    expect(methodologies.length).toBeGreaterThanOrEqual(1);
  });

  it('has at least one boilerplate template', () => {
    const boilerplates = DEFAULT_TEMPLATES.filter((t) => t.type === 'BOILERPLATE');
    expect(boilerplates.length).toBeGreaterThanOrEqual(1);
  });

  it('has CCC Gap Analysis section templates (#221)', () => {
    const cccTemplates = DEFAULT_TEMPLATES.filter(
      (t) => t.reportType === 'CCC_GAP' && t.type === 'SECTION',
    );
    const names = cccTemplates.map((t) => t.name);

    expect(names).toContain('Introduction - CCC Gap Analysis');
    expect(names).toContain('Executive Summary - CCC Gap Analysis');
    expect(names).toContain('Defect Schedule - CCC Gap Analysis');
    expect(names).toContain('Moisture Reading Summary - CCC Gap Analysis');
    expect(names).toContain('Cost Estimate Summary - CCC Gap Analysis');
  });
});
