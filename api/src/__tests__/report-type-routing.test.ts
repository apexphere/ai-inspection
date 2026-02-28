/**
 * Report Type Routing Tests — Issue #548
 */

import { describe, it, expect } from 'vitest';
import {
  getTemplateDir,
  validateTemplatesExist,
  listAvailableReportTypes,
  UnsupportedReportTypeError,
  TemplateNotAvailableError,
} from '../services/report-type-routing.js';

describe('Report Type Routing — #548', () => {
  describe('getTemplateDir', () => {
    it('maps COA to coa', () => {
      expect(getTemplateDir('COA')).toBe('coa');
    });

    it('maps CCC_GAP to ccc', () => {
      expect(getTemplateDir('CCC_GAP')).toBe('ccc');
    });

    it('maps PPI to ppi', () => {
      expect(getTemplateDir('PPI')).toBe('ppi');
    });

    it('maps SAFE_SANITARY to ss', () => {
      expect(getTemplateDir('SAFE_SANITARY')).toBe('ss');
    });

    it('maps TFA to tfa', () => {
      expect(getTemplateDir('TFA')).toBe('tfa');
    });
  });

  describe('validateTemplatesExist', () => {
    it('validates COA templates exist', async () => {
      const dir = await validateTemplatesExist('COA');
      expect(dir).toBe('coa');
    });

    it('validates CCC templates exist', async () => {
      const dir = await validateTemplatesExist('CCC_GAP');
      expect(dir).toBe('ccc');
    });

    it('validates PPI templates exist', async () => {
      const dir = await validateTemplatesExist('PPI');
      expect(dir).toBe('ppi');
    });


    it('throws TemplateNotAvailableError for TFA (no templates yet)', async () => {
      await expect(validateTemplatesExist('TFA')).rejects.toThrow(
        TemplateNotAvailableError,
      );
    });

    it('error message includes report type and path', async () => {
      try {
        await validateTemplatesExist('TFA');
        expect.fail('Should have thrown');
      } catch (error) {
        expect((error as Error).message).toContain('TFA');
        expect((error as Error).message).toContain('Templates not available');
      }
    });
  });

  describe('listAvailableReportTypes', () => {
    it('includes COA, CCC_GAP, PPI, and SAFE_SANITARY', async () => {
      const available = await listAvailableReportTypes();
      expect(available).toContain('COA');
      expect(available).toContain('CCC_GAP');
      expect(available).toContain('PPI');
      expect(available).toContain('SAFE_SANITARY');
    });

    it('does not include types without templates', async () => {
      const available = await listAvailableReportTypes();
      // SS and TFA templates don't exist yet
      expect(available).not.toContain('TFA');
    });
  });
});
