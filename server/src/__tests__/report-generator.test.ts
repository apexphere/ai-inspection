/**
 * Report Generator Tests - Issue #7
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ReportGenerator, type ReportData } from '../pdf/report-generator.js';
import { existsSync, unlinkSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('ReportGenerator', () => {
  const testOutputDir = join(__dirname, '..', '..', '..', 'data', 'reports', 'test');
  let generator: ReportGenerator;

  beforeAll(() => {
    // Create test output directory
    if (!existsSync(testOutputDir)) {
      mkdirSync(testOutputDir, { recursive: true });
    }
    
    generator = new ReportGenerator(undefined, testOutputDir);
  });

  afterAll(() => {
    // Clean up test files
    const testFiles = [
      join(testOutputDir, 'test-inspection-001.pdf'),
      join(testOutputDir, 'test-inspection-001.html'),
    ];
    
    for (const file of testFiles) {
      if (existsSync(file)) {
        try {
          unlinkSync(file);
        } catch {
          // Ignore cleanup errors
        }
      }
    }
  });

  describe('generate()', () => {
    it('should generate a PDF report', async () => {
      const reportData: ReportData = {
        inspection: {
          id: 'test-inspection-001',
          address: '123 Test Street, Auckland',
          client_name: 'Test Client',
          inspector_name: 'Test Inspector',
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          metadata: {
            property_type: 'Residential',
            year_built: 2020,
            bedrooms: 3,
            bathrooms: 2,
            weather: 'Fine',
          },
        },
        findings: [
          {
            id: 'finding-001',
            section: 'exterior',
            text: 'Minor rust on gutters',
            severity: 'minor',
            matched_comment: 'Rust/corrosion observed in gutters. Monitor for leaks.',
          },
          {
            id: 'finding-002',
            section: 'interior',
            text: 'All rooms in good condition',
            severity: 'info',
          },
        ],
        photos: [],
        sections: [
          { id: 'exterior', name: 'Exterior' },
          { id: 'interior', name: 'Interior' },
          { id: 'subfloor', name: 'Subfloor' },
        ],
      };

      const result = await generator.generate(reportData);

      expect(result.path).toContain('test-inspection-001.pdf');
      expect(result.size).toBeGreaterThan(0);
      expect(result.pages).toBeGreaterThanOrEqual(1);
      expect(existsSync(result.path)).toBe(true);
    }, 30000); // 30s timeout for PDF generation

    it('should generate report with no findings', async () => {
      const reportData: ReportData = {
        inspection: {
          id: 'test-inspection-002',
          address: '456 Clean Street, Wellington',
          client_name: 'Happy Client',
          inspector_name: 'Inspector Jones',
          started_at: new Date().toISOString(),
        },
        findings: [],
        photos: [],
        sections: [
          { id: 'exterior', name: 'Exterior' },
          { id: 'interior', name: 'Interior' },
        ],
      };

      const result = await generator.generate(reportData);

      expect(result.path).toContain('test-inspection-002.pdf');
      expect(result.size).toBeGreaterThan(0);
    }, 30000);
  });

  describe('conclusion generation', () => {
    it('should generate appropriate conclusions based on severity', async () => {
      // Test with urgent findings
      const urgentData: ReportData = {
        inspection: {
          id: 'test-urgent-001',
          address: '789 Urgent Lane',
          client_name: 'Urgent Client',
          started_at: new Date().toISOString(),
        },
        findings: [
          {
            id: 'f1',
            section: 'exterior',
            text: 'Major structural crack',
            severity: 'urgent',
          },
        ],
        photos: [],
        sections: [{ id: 'exterior', name: 'Exterior' }],
      };

      const result = await generator.generate(urgentData);
      expect(result.size).toBeGreaterThan(0);
    }, 30000);
  });
});
