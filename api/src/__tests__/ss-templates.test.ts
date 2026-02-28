/**
 * Safe & Sanitary Template Tests — Issue #553
 */

import { describe, it, expect } from 'vitest';
import {
  renderReport,
  renderSection,
  listTemplates,
} from '../services/template-engine.js';

function makeSSReportData() {
  return {
    generatedAt: new Date('2026-02-20T10:00:00Z'),
    project: {
      jobNumber: 'SS-2026-001',
      address: '42 Heritage Lane, Wellington',
      client: 'Heritage Trust Ltd',
      council: 'Wellington City Council',
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
      weather: 'Fine, 20°C',
    },
    buildingInfo: {
      buildingType: 'Townhouse',
      buildingYear: 1969,
      climateZone: 'Zone 2',
      earthquakeZone: 'Zone 1',
      exposureZone: 'Sheltered',
      windZone: 'Medium',
      rainfallRange: '1200-1600mm',
    },
    methodology: {
      description: 'Visual, non-invasive inspection of the building and site.',
      equipment: ['Moisture meter', 'Thermal camera'],
      areasNotAccessed: 'Sub-floor space not accessible.',
      documentsReviewed: ['LIM report', 'Title documents'],
    },
    assessmentItems: [
      {
        items: 'Foundation',
        details: 'Raised Perimeter Block Wall and Post and Pier Foundation',
        photoRefs: 'Photograph 5, 6, 7',
        observations: 'Foundation in good condition, no visible cracking.',
        complianceRequirement: 'Building Act 1991 s.64(1) — not unsafe',
        remedialWorks: 'Nil',
        assessmentType: 'safety',
      },
      {
        items: 'Walls',
        details: 'Weatherboard cladding',
        photoRefs: 'Photograph 8, 9',
        observations: 'Walls intact, minor paint deterioration.',
        complianceRequirement: 'Building Act 1991 s.64(1) — not unsafe',
        remedialWorks: 'Nil',
        assessmentType: 'safety',
      },
      {
        items: 'Shower',
        details: 'Tiled shower over bath',
        photoRefs: 'Photograph 12',
        observations: 'Functional, grout in acceptable condition.',
        complianceRequirement: 'Building Act 1991 s.64(4) — not insanitary',
        remedialWorks: 'Nil',
        assessmentType: 'sanitary',
      },
      {
        items: 'Hot Water',
        details: 'Electric cylinder',
        photoRefs: 'Photograph 15',
        observations: 'Operational, adequate supply.',
        complianceRequirement: 'Building Act 1991 s.64(4) — not insanitary',
        remedialWorks: 'Nil',
        assessmentType: 'sanitary',
      },
    ],
    isSafe: true,
    isSanitary: true,
    remedialWorksNeeded: false,
    appendices: {
      photos: [
        { number: 1, caption: 'Front elevation', location: 'Street view', base64: 'dGVzdA==' },
        { number: 2, caption: 'Foundation detail', location: 'South side', base64: 'dGVzdA==' },
      ],
    },
  };
}

describe('SS Templates — #553', () => {
  describe('listTemplates', () => {
    it('lists SS section and appendix templates', async () => {
      const result = await listTemplates('ss');

      expect(result.sections).toHaveLength(9);
      expect(result.sections).toContain('01-report-info-summary.hbs');
      expect(result.sections).toContain('05-assessment-framework.hbs');
      expect(result.sections).toContain('09-signatures.hbs');

      expect(result.appendices).toContain('photos.hbs');
      expect(result.appendices).toHaveLength(1);
    });
  });

  describe('renderSection', () => {
    it('renders report info summary with job details', async () => {
      const data = makeSSReportData();
      const html = await renderSection('ss', '01-report-info-summary.hbs', data);

      expect(html).toContain('Report Information Summary');
      expect(html).toContain('SS-2026-001');
      expect(html).toContain('42 Heritage Lane, Wellington');
      expect(html).toContain('John Smith');
    });

    it('renders introduction with Building Act reference', async () => {
      const data = makeSSReportData();
      const html = await renderSection('ss', '02-introduction.hbs', data);

      expect(html).toContain('Introduction');
      expect(html).toContain('Building Act 1991, Section 64');
      expect(html).toContain('42 Heritage Lane, Wellington');
    });

    it('renders building description with zone data', async () => {
      const data = makeSSReportData();
      const html = await renderSection('ss', '03-building-site-description.hbs', data);

      expect(html).toContain('Townhouse');
      expect(html).toContain('1969');
      expect(html).toContain('Zone 2');
      expect(html).toContain('Medium');
    });

    it('renders assessment framework with safety items', async () => {
      const data = makeSSReportData();
      const html = await renderSection('ss', '05-assessment-framework.hbs', data);

      expect(html).toContain('Assessment Framework');
      expect(html).toContain('Safety Assessment');
      expect(html).toContain('s.64(1)');
      expect(html).toContain('Foundation');
      expect(html).toContain('Walls');
    });

    it('renders assessment framework with sanitary items', async () => {
      const data = makeSSReportData();
      const html = await renderSection('ss', '05-assessment-framework.hbs', data);

      expect(html).toContain('Sanitary Assessment');
      expect(html).toContain('s.64(4)');
      expect(html).toContain('Shower');
      expect(html).toContain('Hot Water');
    });

    it('renders summary with safe and sanitary conclusion', async () => {
      const data = makeSSReportData();
      const html = await renderSection('ss', '07-summary.hbs', data);

      expect(html).toContain('Safe and Sanitary condition');
      expect(html).toContain('42 Heritage Lane, Wellington');
    });

    it('renders summary with remedial works when not safe', async () => {
      const data = makeSSReportData();
      data.isSafe = false;
      const html = await renderSection('ss', '07-summary.hbs', data);

      expect(html).toContain('remedial works are required');
    });

    it('renders no remedial works message when none needed', async () => {
      const data = makeSSReportData();
      const html = await renderSection('ss', '06-remedial-works.hbs', data);

      expect(html).toContain('No remedial works are required');
    });

    it('renders signatures with declaration', async () => {
      const data = makeSSReportData();
      const html = await renderSection('ss', '09-signatures.hbs', data);

      expect(html).toContain('Declaration');
      expect(html).toContain('John Smith');
      expect(html).toContain('Jane Doe');
    });
  });

  describe('renderReport', () => {
    it('renders full SS report with all 9 sections', async () => {
      const data = makeSSReportData();
      const html = await renderReport({ reportType: 'ss', data });

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('Safe & Sanitary Report');
      expect(html).toContain('SS-2026-001');

      // All 9 sections
      for (let i = 1; i <= 9; i++) {
        expect(html).toContain(`id="section-${i}"`);
      }

      // Appendix
      expect(html).toContain('id="appendix-a"');

      // Footer
      expect(html).toContain('CONFIDENTIAL');
    });

    it('includes photo data in appendix', async () => {
      const data = makeSSReportData();
      const html = await renderReport({ reportType: 'ss', data });

      expect(html).toContain('Photograph 1');
      expect(html).toContain('Front elevation');
      expect(html).toContain('data:image/jpeg;base64,dGVzdA==');
    });

    it('includes CSS', async () => {
      const data = makeSSReportData();
      const html = await renderReport({ reportType: 'ss', data });

      expect(html).toContain('@page');
      expect(html).toContain('assessment-table');
    });
  });
});
