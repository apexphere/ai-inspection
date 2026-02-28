/**
 * Template Engine Tests — Issue #193
 *
 * Tests for the Handlebars template engine service.
 */

import { describe, it, expect } from 'vitest';
import {
  renderReport,
  renderSection,
  listTemplates,
} from '../services/template-engine.js';

// ──────────────────────────────────────────────────────────────────────────────
// Test data
// ──────────────────────────────────────────────────────────────────────────────

function makeReportData() {
  return {
    generatedAt: new Date('2026-02-20T10:00:00Z'),
    project: {
      jobNumber: 'JOB-2026-001',
      activity: 'Bathroom renovation',
      address: '123 Test Street, Auckland',
      client: 'Test Client Ltd',
      council: 'Auckland Council',
      company: 'Apex Inspection Services',
    },
    personnel: {
      author: {
        name: 'John Smith',
        credentials: 'BSCE, LBP #12345',
      },
      reviewer: {
        name: 'Jane Doe',
        credentials: 'MSCE, LBP #67890',
      },
      inspectors: [
        { name: 'John Smith', role: 'Lead Inspector' },
      ],
    },
    inspection: {
      date: '2026-02-15T00:00:00Z',
      weather: 'Fine, 22°C',
    },
    property: {
      lotDp: 'Lot 1 DP 12345',
      councilId: 'AKL-98765',
      zones: {
        wind: 'Medium',
        earthquake: 'Zone 1',
        exposure: 'Sheltered',
      },
      buildingHistory: [
        { type: 'Building Consent', reference: 'BC/2020/1234', date: '2020-03-15' },
      ],
      worksDescription: 'Complete bathroom renovation including plumbing and tiling.',
    },
    methodology: {
      description: 'Visual inspection of all accessible areas.',
      equipment: ['Moisture meter', 'Thermal camera', 'Laser level'],
      areasNotAccessed: 'Sub-floor space was not accessible.',
      documentsReviewed: ['Original building consent', 'As-built plans'],
    },
    clauseReviews: [
      {
        code: 'B1',
        title: 'Structure',
        applicability: 'Applicable',
        photoRefs: ['1', '2'],
        observations: 'Structure appears sound with no visible defects.',
        docsProvided: ['Appendix C'],
        complianceText: 'Compliant',
        remedialWorks: 'Nil',
      },
      {
        code: 'B2',
        title: 'Durability',
        applicability: 'N/A',
        photoRefs: [],
        observations: '',
        docsProvided: [],
        complianceText: '',
        remedialWorks: '',
      },
    ],
    remedialItems: [
      { item: 'Flashing repair', description: 'Replace damaged flashing at window junction.' },
    ],
    appendices: {
      photos: [
        { number: 1, caption: 'Front elevation', source: 'Site', base64: 'dGVzdA==' },
        { number: 2, caption: 'Bathroom interior', source: 'Site', base64: 'dGVzdA==' },
      ],
      drawings: [
        { title: 'Floor plan', pages: 2 },
      ],
      documents: [
        { letter: 'C', title: 'Electrical CoC', pages: 1 },
      ],
      certificates: [
        { type: 'Electrical', reference: 'COC-2026-001', date: '2026-01-10' },
      ],
    },
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────────────────────────────────────

describe('Template Engine', () => {
  describe('listTemplates', () => {
    it('lists COA section and appendix templates', async () => {
      const result = await listTemplates('coa');

      expect(result.sections).toContain('01-summary.hbs');
      expect(result.sections).toContain('05-clause-review.hbs');
      expect(result.sections).toContain('07-signatures.hbs');
      expect(result.sections).toHaveLength(7);

      expect(result.appendices).toContain('a-photos.hbs');
      expect(result.appendices).toContain('c-reports.hbs');
      expect(result.appendices.length).toBeGreaterThanOrEqual(4);
    });

    it('returns empty arrays for unknown report type', async () => {
      const result = await listTemplates('unknown');
      expect(result.sections).toEqual([]);
      expect(result.appendices).toEqual([]);
    });
  });

  describe('renderSection', () => {
    it('renders section 01 summary with project data', async () => {
      const data = makeReportData();
      const html = await renderSection('coa', '01-summary.hbs', data);

      expect(html).toContain('Executive Summary');
      expect(html).toContain('JOB-2026-001');
      expect(html).toContain('123 Test Street, Auckland');
      expect(html).toContain('John Smith');
      expect(html).toContain('BSCE, LBP #12345');
    });

    it('renders section 05 clause review with table', async () => {
      const data = makeReportData();
      const html = await renderSection('coa', '05-clause-review.hbs', data);

      expect(html).toContain('Building Code Clause Review');
      expect(html).toContain('B1');
      expect(html).toContain('Structure');
      expect(html).toContain('clause-applicable');
      expect(html).toContain('clause-na');
      expect(html).toContain('Photograph 1, Photograph 2');
    });

    it('renders section 06 remedial works', async () => {
      const data = makeReportData();
      const html = await renderSection('coa', '06-remedial-works.hbs', data);

      expect(html).toContain('Flashing repair');
      expect(html).toContain('Replace damaged flashing');
    });

    it('renders section 06 with no remedial works message', async () => {
      const data = makeReportData();
      data.remedialItems = [];
      const html = await renderSection('coa', '06-remedial-works.hbs', data);

      expect(html).toContain('No remedial works are required');
    });

    it('renders section 07 signatures', async () => {
      const data = makeReportData();
      const html = await renderSection('coa', '07-signatures.hbs', data);

      expect(html).toContain('John Smith');
      expect(html).toContain('Jane Doe');
      expect(html).toContain('Declaration');
    });
  });

  describe('renderReport', () => {
    it('renders full COA report with all sections', async () => {
      const data = makeReportData();
      const html = await renderReport({ reportType: 'coa', data });

      // Base layout
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('Certificate of Acceptance Report');

      // Header
      expect(html).toContain('JOB-2026-001');

      // CSS included
      expect(html).toContain('@page');
      expect(html).toContain('font-family');

      // All 7 sections present
      expect(html).toContain('id="section-1"');
      expect(html).toContain('id="section-2"');
      expect(html).toContain('id="section-3"');
      expect(html).toContain('id="section-4"');
      expect(html).toContain('id="section-5"');
      expect(html).toContain('id="section-6"');
      expect(html).toContain('id="section-7"');

      // Appendices present
      expect(html).toContain('id="appendix-a"');
      expect(html).toContain('id="appendix-b"');
      expect(html).toContain('id="appendix-c"');
      expect(html).toContain('id="appendix-d"');

      // Footer
      expect(html).toContain('CONFIDENTIAL');
    });

    it('includes photo data in appendix', async () => {
      const data = makeReportData();
      const html = await renderReport({ reportType: 'coa', data });

      expect(html).toContain('Photograph 1');
      expect(html).toContain('Front elevation');
      expect(html).toContain('data:image/jpeg;base64,dGVzdA==');
    });
  });

  describe('helpers', () => {
    it('formatDate renders NZ locale date', async () => {
      const data = makeReportData();
      const html = await renderSection('coa', '01-summary.hbs', data);
      // Should contain formatted date (15 February 2026)
      expect(html).toContain('February');
      expect(html).toContain('2026');
    });

    it('photoRef renders dash for empty refs', async () => {
      const data = makeReportData();
      const html = await renderSection('coa', '05-clause-review.hbs', data);
      // B2 has no photo refs — should show dash
      expect(html).toContain('—');
    });
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// PPI Test data
// ──────────────────────────────────────────────────────────────────────────────

function makePPIReportData() {
  return {
    generatedAt: new Date('2026-02-20T10:00:00Z'),
    project: {
      jobNumber: 'PPI-2026-001',
      address: '45 Example Road, Auckland',
      client: 'Home Buyer Ltd',
      company: 'Apex Inspection Services',
    },
    personnel: {
      author: {
        name: 'John Smith',
        credentials: 'BSCE, LBP #12345',
      },
      inspectors: [{ name: 'John Smith', role: 'Lead Inspector' }],
    },
    inspection: {
      date: '2026-02-18T00:00:00Z',
      weather: 'Overcast, 18°C',
    },
    property: {
      type: 'Standalone dwelling',
      yearBuilt: '1985',
      bedrooms: '3',
      bathrooms: '2',
      garaging: 'Single garage',
      cccStatus: 'Issued',
    },
    methodology: {
      areasNotAccessed: 'Sub-floor space (access hatch blocked)',
      documentsReviewed: ['LIM report', 'Title documents'],
    },
    findings: {
      summary: 'Property is in fair condition with some maintenance required.',
    },
    siteGround: {
      items: [
        { name: 'Topography', condition: 'Good', observations: 'Level site', photoRefs: [] },
        { name: 'Retaining walls', condition: 'Fair', observations: 'Minor cracking noted', photoRefs: ['1'], issue: true },
      ],
    },
    exterior: {
      items: [
        { name: 'Roof', condition: 'Good', observations: 'Concrete tiles in good condition', photoRefs: ['2'] },
        { name: 'Cladding', condition: 'Fair', observations: 'Weatherboard, some paint peeling', photoRefs: ['3'], issue: true },
      ],
    },
    interior: {
      living: {
        items: [
          { name: 'Walls', condition: 'Good', observations: 'No defects noted', photoRefs: [] },
        ],
      },
      bathrooms: {
        items: [
          { name: 'Shower', condition: 'Fair', observations: 'Grout needs resealing', photoRefs: ['4'], issue: true },
        ],
        moistureReadings: [
          { location: 'Bathroom 1 - shower wall', reading: '12', result: 'Acceptable' },
          { location: 'Bathroom 2 - floor', reading: '22', result: 'Marginal' },
        ],
      },
    },
    services: {
      items: [
        { name: 'Switchboard', condition: 'Good', observations: 'Modern RCD protection fitted', photoRefs: [] },
        { name: 'Hot water', condition: 'Good', observations: 'Electric cylinder, 10 years old', photoRefs: [] },
      ],
    },
    conclusions: {
      rating: 'Fair',
      summary: 'The property is generally in fair condition for its age. Some maintenance and minor repairs are recommended.',
      immediateAttention: ['Reseal shower grout in bathroom 1'],
      maintenance: ['Repaint weatherboard cladding', 'Monitor retaining wall cracks'],
      furtherInvestigation: ['Structural engineer assessment of retaining wall if cracks worsen'],
    },
    appendices: {
      photos: [
        { number: 1, caption: 'Retaining wall crack', location: 'Side boundary', base64: 'dGVzdA==' },
        { number: 2, caption: 'Roof condition', location: 'Front elevation', base64: 'dGVzdA==' },
        { number: 3, caption: 'Paint peeling', location: 'West wall', base64: 'dGVzdA==' },
        { number: 4, caption: 'Shower grout', location: 'Bathroom 1', base64: 'dGVzdA==' },
      ],
    },
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// PPI Tests
// ──────────────────────────────────────────────────────────────────────────────

describe('PPI Templates', () => {
  describe('listTemplates', () => {
    it('lists PPI section and appendix templates', async () => {
      const result = await listTemplates('ppi');

      expect(result.sections).toContain('01-executive-summary.hbs');
      expect(result.sections).toContain('05-interior.hbs');
      expect(result.sections).toContain('08-signatures.hbs');
      expect(result.sections).toHaveLength(8);

      expect(result.appendices).toContain('photos.hbs');
      expect(result.appendices).toHaveLength(1);
    });
  });

  describe('renderSection', () => {
    it('renders PPI executive summary with property details', async () => {
      const data = makePPIReportData();
      const html = await renderSection('ppi', '01-executive-summary.hbs', data);

      expect(html).toContain('Executive Summary');
      expect(html).toContain('PPI-2026-001');
      expect(html).toContain('45 Example Road, Auckland');
      expect(html).toContain('Standalone dwelling');
      expect(html).toContain('1985');
    });

    it('renders PPI interior with moisture readings', async () => {
      const data = makePPIReportData();
      const html = await renderSection('ppi', '05-interior.hbs', data);

      expect(html).toContain('Interior of Building');
      expect(html).toContain('Bathrooms');
      expect(html).toContain('Moisture Readings');
      expect(html).toContain('Bathroom 1 - shower wall');
      expect(html).toContain('Acceptable');
      expect(html).toContain('Marginal');
    });

    it('renders PPI conclusions with recommendations', async () => {
      const data = makePPIReportData();
      const html = await renderSection('ppi', '07-conclusions.hbs', data);

      expect(html).toContain('Conclusions and Recommendations');
      expect(html).toContain('Fair');
      expect(html).toContain('Reseal shower grout');
      expect(html).toContain('Repaint weatherboard');
      expect(html).toContain('Structural engineer');
    });
  });

  describe('renderReport', () => {
    it('renders full PPI report with all sections', async () => {
      const data = makePPIReportData();
      const html = await renderReport({ reportType: 'ppi', data });

      // Base layout
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('Pre-Purchase Inspection Report');

      // Header
      expect(html).toContain('PPI-2026-001');

      // CSS included
      expect(html).toContain('@page');
      expect(html).toContain('font-family');

      // All 8 sections present
      expect(html).toContain('id="section-1"');
      expect(html).toContain('id="section-2"');
      expect(html).toContain('id="section-3"');
      expect(html).toContain('id="section-4"');
      expect(html).toContain('id="section-5"');
      expect(html).toContain('id="section-6"');
      expect(html).toContain('id="section-7"');
      expect(html).toContain('id="section-8"');

      // Appendix present
      expect(html).toContain('id="appendix-a"');

      // Footer
      expect(html).toContain('CONFIDENTIAL');
    });

    it('includes photo data in appendix', async () => {
      const data = makePPIReportData();
      const html = await renderReport({ reportType: 'ppi', data });

      expect(html).toContain('Photograph 1');
      expect(html).toContain('Retaining wall crack');
      expect(html).toContain('data:image/jpeg;base64,dGVzdA==');
    });
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// CCC Document Control Tests — Issue #546
// ──────────────────────────────────────────────────────────────────────────────

function makeCCCReportData(withDocControl = true) {
  const base = {
    generatedAt: new Date('2026-02-20T10:00:00Z'),
    project: {
      jobNumber: 'CCC-2026-001',
      activity: 'Bathroom renovation',
      address: '123 Test Street, Auckland',
      client: 'Test Client Ltd',
      council: 'Auckland Council',
      company: 'Apex Inspection Services',
    },
    personnel: {
      author: {
        name: 'Jake Li',
        credentials: 'BSCE, LBP #12345',
        phone: '021 123 4567',
        email: 'jake@eastern.co.nz',
      },
      reviewer: {
        name: 'John Smith',
        credentials: 'MSCE, LBP #67890',
      },
      inspectors: [
        { name: 'Jake Li', role: 'Lead Inspector' },
      ],
    },
    inspection: {
      date: '2026-02-15T00:00:00Z',
      weather: 'Fine, 22°C',
    },
    defects: [
      { description: 'Flashing issue at window', severity: 'major' },
    ],
  };

  if (withDocControl) {
    return {
      ...base,
      documentControl: {
        revisions: [
          { revNo: 1, preparedBy: 'J. Li', description: 'Initial Issue', date: '2026-02-15' },
          { revNo: 2, preparedBy: 'J. Li', description: 'Updated findings', date: '2026-02-18' },
        ],
        acceptance: [
          { action: 'Prepared', name: 'Jake Li', signed: true, date: '2026-02-18' },
          { action: 'Reviewed', name: 'John Smith', signed: false },
          { action: 'Approved', name: '', signed: false },
        ],
      },
    };
  }

  return base;
}

describe('CCC Document Control — #546', () => {
  describe('renderReport', () => {
    it('renders Document Control page when documentControl data is provided', async () => {
      const data = makeCCCReportData(true);
      const html = await renderReport({ reportType: 'ccc', data });

      // Document Control content appears
      expect(html).toContain('Document Control Records');
      expect(html).toContain('Revision History');
      expect(html).toContain('Initial Issue');
      expect(html).toContain('Updated findings');
      expect(html).toContain('J. Li');

      // Document Acceptance
      expect(html).toContain('Document Acceptance');
      expect(html).toContain('Prepared');
      expect(html).toContain('Reviewed');
      expect(html).toContain('Approved');
      expect(html).toContain('Jake Li');
      expect(html).toContain('John Smith');
    });

    it('omits Document Control page when no documentControl data', async () => {
      const data = makeCCCReportData(false);
      const html = await renderReport({ reportType: 'ccc', data });

      expect(html).not.toContain('Document Control Records');
      expect(html).not.toContain('Revision History');
    });

    it('Document Control appears before Table of Contents in HTML', async () => {
      const data = makeCCCReportData(true);
      (data as Record<string, unknown>).tableOfContents = '<ul><li>Section 1</li></ul>';
      const html = await renderReport({ reportType: 'ccc', data });

      const docControlPos = html.indexOf('Document Control Records');
      const tocPos = html.indexOf('<nav class="table-of-contents"');

      // If TOC exists, Document Control must come first
      if (tocPos !== -1) {
        expect(docControlPos).toBeLessThan(tocPos);
      }
      // Document Control must exist regardless
      expect(docControlPos).toBeGreaterThan(-1);
    });

    it('includes preparer contact details', async () => {
      const data = makeCCCReportData(true);
      const html = await renderReport({ reportType: 'ccc', data });

      expect(html).toContain('021 123 4567');
      expect(html).toContain('jake@eastern.co.nz');
    });
  });

  it('COA report does NOT include Document Control', async () => {
    const data = makeReportData();
    (data as Record<string, unknown>).documentControl = {
      revisions: [{ revNo: 1, preparedBy: 'Test', description: 'Test', date: '2026-01-01' }],
      acceptance: [],
    };
    const html = await renderReport({ reportType: 'coa', data });

    expect(html).not.toContain('Document Control Records');
  });

  it('PPI report does NOT include Document Control', async () => {
    const data = makePPIReportData();
    (data as Record<string, unknown>).documentControl = {
      revisions: [{ revNo: 1, preparedBy: 'Test', description: 'Test', date: '2026-01-01' }],
      acceptance: [],
    };
    const html = await renderReport({ reportType: 'ppi', data });

    expect(html).not.toContain('Document Control Records');
  });
});
