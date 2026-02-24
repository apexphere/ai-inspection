/**
 * Template Engine Tests — Issue #193
 *
 * Tests for the Handlebars template engine service.
 */

import { describe, it, expect, beforeAll } from 'vitest';
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
