/**
 * Template Engine Tests — Issue #193
 *
 * Tests for Handlebars template rendering, helpers, and partials.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { TemplateEngine, TemplateNotFoundError } from '../services/template-engine.js';

// ──────────────────────────────────────────────────────────────────────────────
// Fixtures
// ──────────────────────────────────────────────────────────────────────────────

function makeContext(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    reportTitle: 'Certificate of Acceptance Report',
    companyLogo: null,
    generatedDate: '2026-02-20T00:00:00Z',
    project: {
      jobNumber: 'JOB-2026-001',
      activity: 'Bathroom renovation',
      address: '123 Test Street, Auckland',
      client: 'Test Client Ltd',
      council: 'Auckland Council',
    },
    personnel: {
      author: { name: 'John Smith', credentials: 'BRANZ LBP #12345', signature: null },
      reviewer: { name: 'Jane Doe', credentials: 'BRANZ LBP #67890', signature: null },
      inspectors: [{ name: 'John Smith', role: 'Lead Inspector' }],
    },
    inspection: {
      date: '2026-02-15T00:00:00Z',
      weather: 'Fine, 22°C',
    },
    property: {
      lotDp: 'Lot 1 DP 12345',
      councilId: 'ABC-2026-001',
      zones: { wind: 'Medium', earthquake: 'Zone 1', exposure: 'Zone B' },
      buildingHistory: [
        { type: 'Building Consent', reference: 'BC-2020-001', date: '2020-05-15' },
      ],
      worksDescription: 'Complete bathroom renovation including plumbing and electrical.',
    },
    methodology: {
      description: 'Visual inspection of all accessible areas.',
      equipment: ['Moisture meter', 'Thermal camera'],
      areasNotAccessed: 'Sub-floor area (limited access)',
      documentsReviewed: ['Original consent drawings', 'Producer statements'],
    },
    clauseReviews: [
      {
        code: 'B1',
        title: 'Structure',
        applicability: 'Applicable',
        photoRefs: [1, 2],
        observations: 'Structure appears sound.',
        docsProvided: ['Appendix C'],
        complianceText: 'Complies with B1/AS1.',
        remedialWorks: 'Nil',
      },
      {
        code: 'E1',
        title: 'Surface Water',
        applicability: 'N/A',
        photoRefs: [],
        observations: '',
        docsProvided: [],
        complianceText: '',
        remedialWorks: '',
      },
    ],
    remedialItems: [
      { item: 'Flashing repair', description: 'Replace damaged flashing at roof junction.' },
    ],
    appendices: {
      photos: [
        { number: 1, caption: 'Front elevation', source: 'Site', base64: 'dGVzdA==' },
        { number: 2, caption: 'Bathroom interior', source: 'Site', base64: 'dGVzdA==' },
      ],
      drawings: [],
      documents: [
        { letter: 'C', title: 'Producer Statement PS1', pages: 2 },
      ],
      certificates: [],
    },
    ...overrides,
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────────────────────────────────────

describe('TemplateEngine', () => {
  let engine: TemplateEngine;

  beforeAll(() => {
    engine = new TemplateEngine();
    engine.init();
  });

  describe('init', () => {
    it('lists available report types', () => {
      const types = engine.listReportTypes();
      expect(types).toContain('coa');
    });

    it('lists COA sections', () => {
      const sections = engine.listSections('coa');
      expect(sections).toContain('01-summary');
      expect(sections).toContain('05-clause-review');
      expect(sections).toContain('07-signatures');
      expect(sections).toHaveLength(7);
    });
  });

  describe('render', () => {
    it('renders full COA report HTML', () => {
      const html = engine.render('coa', makeContext());

      // Check structure
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('Certificate of Acceptance Report');
      expect(html).toContain('JOB-2026-001');

      // Check all 7 sections present
      expect(html).toContain('id="section-1"');
      expect(html).toContain('id="section-2"');
      expect(html).toContain('id="section-3"');
      expect(html).toContain('id="section-4"');
      expect(html).toContain('id="section-5"');
      expect(html).toContain('id="section-6"');
      expect(html).toContain('id="section-7"');

      // Check CSS included
      expect(html).toContain('font-family');
    });

    it('includes appendix A (photos) when photos exist', () => {
      const html = engine.render('coa', makeContext());
      expect(html).toContain('id="appendix-a"');
      expect(html).toContain('Front elevation');
    });

    it('excludes empty appendices', () => {
      const ctx = makeContext({
        appendices: { photos: [], drawings: [], documents: [], certificates: [] },
      });
      const html = engine.render('coa', ctx);
      expect(html).not.toContain('id="appendix-a"');
      expect(html).not.toContain('id="appendix-b"');
    });

    it('throws TemplateNotFoundError for unknown report type', () => {
      expect(() => engine.render('nonexistent', makeContext())).toThrow(TemplateNotFoundError);
    });
  });

  describe('renderSection', () => {
    it('renders a single section', () => {
      const html = engine.renderSection('coa', '01-summary', makeContext());
      expect(html).toContain('Executive Summary');
      expect(html).toContain('JOB-2026-001');
      expect(html).toContain('Test Client Ltd');
    });

    it('throws for unknown section', () => {
      expect(() => engine.renderSection('coa', 'nonexistent', makeContext())).toThrow(
        TemplateNotFoundError,
      );
    });
  });

  describe('helpers', () => {
    it('formatDate formats dates correctly', () => {
      const html = engine.renderSection('coa', '01-summary', makeContext());
      expect(html).toContain('15 February 2026');
    });

    it('photoRef formats photo references', () => {
      const html = engine.render('coa', makeContext());
      expect(html).toContain('Photograph 1, 2');
    });

    it('clauseClass returns correct CSS class', () => {
      const html = engine.render('coa', makeContext());
      expect(html).toContain('clause-applicable');
      expect(html).toContain('clause-na');
    });

    it('inc helper increments index', () => {
      const html = engine.render('coa', makeContext());
      // Remedial item #1
      expect(html).toContain('<td>1</td>');
    });
  });

  describe('data rendering', () => {
    it('renders property details', () => {
      const html = engine.renderSection('coa', '03-building-description', makeContext());
      expect(html).toContain('Lot 1 DP 12345');
      expect(html).toContain('Medium'); // wind zone
      expect(html).toContain('Building Consent');
    });

    it('renders methodology', () => {
      const html = engine.renderSection('coa', '04-methodology', makeContext());
      expect(html).toContain('Moisture meter');
      expect(html).toContain('Sub-floor area');
    });

    it('renders clause review table', () => {
      const html = engine.render('coa', makeContext());
      expect(html).toContain('B1');
      expect(html).toContain('Structure');
      expect(html).toContain('Structure appears sound.');
    });

    it('renders remedial works', () => {
      const html = engine.render('coa', makeContext());
      expect(html).toContain('Flashing repair');
    });

    it('shows no remedial message when empty', () => {
      const ctx = makeContext({ remedialItems: [] });
      const html = engine.render('coa', ctx);
      expect(html).toContain('No remedial works are required');
    });

    it('renders reviewer signature block when reviewer exists', () => {
      const html = engine.render('coa', makeContext());
      expect(html).toContain('Jane Doe');
      expect(html).toContain('Reviewed By');
    });

    it('omits reviewer block when no reviewer', () => {
      const ctx = makeContext({
        personnel: {
          author: { name: 'John Smith', credentials: 'LBP #123' },
          reviewer: null,
          inspectors: [],
        },
      });
      const html = engine.render('coa', ctx);
      expect(html).not.toContain('Reviewed By');
    });
  });
});
