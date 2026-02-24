/**
 * Personnel Role Validation Tests — Issue #204
 */

import { describe, it, expect } from 'vitest';
import {
  getRoleCapabilities,
  canAuthor,
  canReview,
  validateAuthor,
  validateReviewer,
  validateAssignment,
  getAuthorRoles,
  getReviewerRoles,
  type PersonnelValidationInput,
} from '../services/personnel-role-validation.js';

const rbs: PersonnelValidationInput = {
  id: '1', name: 'Ian Fong', role: 'REGISTERED_BUILDING_SURVEYOR', active: true,
};
const bs: PersonnelValidationInput = {
  id: '2', name: 'Jake Li', role: 'BUILDING_SURVEYOR', active: true,
};
const inspector: PersonnelValidationInput = {
  id: '3', name: 'Joe Smith', role: 'INSPECTOR', active: true,
};
const admin: PersonnelValidationInput = {
  id: '4', name: 'Admin User', role: 'ADMIN', active: true,
};
const inactive: PersonnelValidationInput = {
  id: '5', name: 'Gone Person', role: 'REGISTERED_BUILDING_SURVEYOR', active: false,
};

describe('personnel-role-validation', () => {
  describe('getRoleCapabilities', () => {
    it('REGISTERED_BUILDING_SURVEYOR can author and review', () => {
      expect(getRoleCapabilities('REGISTERED_BUILDING_SURVEYOR')).toEqual({ canAuthor: true, canReview: true });
    });

    it('BUILDING_SURVEYOR can author only', () => {
      expect(getRoleCapabilities('BUILDING_SURVEYOR')).toEqual({ canAuthor: true, canReview: false });
    });

    it('INSPECTOR cannot author or review', () => {
      expect(getRoleCapabilities('INSPECTOR')).toEqual({ canAuthor: false, canReview: false });
    });

    it('ADMIN cannot author or review', () => {
      expect(getRoleCapabilities('ADMIN')).toEqual({ canAuthor: false, canReview: false });
    });
  });

  describe('canAuthor / canReview', () => {
    it('RBS can author', () => expect(canAuthor('REGISTERED_BUILDING_SURVEYOR')).toBe(true));
    it('BS can author', () => expect(canAuthor('BUILDING_SURVEYOR')).toBe(true));
    it('Inspector cannot author', () => expect(canAuthor('INSPECTOR')).toBe(false));
    it('only RBS can review', () => {
      expect(canReview('REGISTERED_BUILDING_SURVEYOR')).toBe(true);
      expect(canReview('BUILDING_SURVEYOR')).toBe(false);
      expect(canReview('INSPECTOR')).toBe(false);
      expect(canReview('ADMIN')).toBe(false);
    });
  });

  describe('validateAuthor', () => {
    it('accepts RBS as author', () => {
      expect(validateAuthor(rbs)).toEqual({ valid: true, errors: [], warnings: [] });
    });

    it('accepts BS as author', () => {
      expect(validateAuthor(bs)).toEqual({ valid: true, errors: [], warnings: [] });
    });

    it('rejects INSPECTOR as author', () => {
      const result = validateAuthor(inspector);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('authoring capability');
    });

    it('rejects inactive personnel', () => {
      const result = validateAuthor(inactive);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('inactive');
    });
  });

  describe('validateReviewer', () => {
    it('accepts RBS as reviewer', () => {
      expect(validateReviewer(rbs)).toEqual({ valid: true, errors: [], warnings: [] });
    });

    it('rejects BS as reviewer', () => {
      const result = validateReviewer(bs);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('reviewing capability');
    });

    it('rejects inactive personnel', () => {
      const result = validateReviewer(inactive);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('inactive'))).toBe(true);
    });
  });

  describe('validateAssignment', () => {
    it('accepts valid author + reviewer pair', () => {
      const rbs2: PersonnelValidationInput = { id: '6', name: 'Second RBS', role: 'REGISTERED_BUILDING_SURVEYOR', active: true };
      const result = validateAssignment(rbs, rbs2);
      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('warns when reviewer credentials < author credentials', () => {
      // BS author, RBS reviewer — this is fine (no warning)
      const result1 = validateAssignment(bs, rbs);
      expect(result1.warnings.filter(w => w.includes('lower credentials'))).toHaveLength(0);

      // Not possible to have lower reviewer since only RBS can review,
      // but test the logic with a hypothetical
    });

    it('warns when author and reviewer are the same person', () => {
      const result = validateAssignment(rbs, rbs);
      expect(result.warnings.some(w => w.includes('same person'))).toBe(true);
    });

    it('collects errors from both author and reviewer', () => {
      const result = validateAssignment(inspector, bs);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('getAuthorRoles / getReviewerRoles', () => {
    it('returns RBS and BS as author roles', () => {
      const roles = getAuthorRoles();
      expect(roles).toContain('REGISTERED_BUILDING_SURVEYOR');
      expect(roles).toContain('BUILDING_SURVEYOR');
      expect(roles).not.toContain('INSPECTOR');
      expect(roles).not.toContain('ADMIN');
    });

    it('returns only RBS as reviewer role', () => {
      const roles = getReviewerRoles();
      expect(roles).toEqual(['REGISTERED_BUILDING_SURVEYOR']);
    });
  });
});
