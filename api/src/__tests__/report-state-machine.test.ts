/**
 * Report State Machine Tests — Issue #210
 */

import { describe, it, expect } from 'vitest';
import {
  ReportStateMachine,
  InvalidTransitionError,
  InsufficientRoleError,
} from '../services/report-state-machine.js';

describe('ReportStateMachine', () => {
  const sm = new ReportStateMachine();

  describe('canTransition', () => {
    it('should allow DRAFT → IN_REVIEW', () => {
      expect(sm.canTransition('DRAFT', 'IN_REVIEW')).toBe(true);
    });

    it('should allow IN_REVIEW → DRAFT', () => {
      expect(sm.canTransition('IN_REVIEW', 'DRAFT')).toBe(true);
    });

    it('should allow IN_REVIEW → APPROVED', () => {
      expect(sm.canTransition('IN_REVIEW', 'APPROVED')).toBe(true);
    });

    it('should allow APPROVED → FINALIZED', () => {
      expect(sm.canTransition('APPROVED', 'FINALIZED')).toBe(true);
    });

    it('should allow FINALIZED → SUBMITTED', () => {
      expect(sm.canTransition('FINALIZED', 'SUBMITTED')).toBe(true);
    });

    it('should reject DRAFT → APPROVED (skip IN_REVIEW)', () => {
      expect(sm.canTransition('DRAFT', 'APPROVED')).toBe(false);
    });

    it('should reject DRAFT → FINALIZED', () => {
      expect(sm.canTransition('DRAFT', 'FINALIZED')).toBe(false);
    });

    it('should reject SUBMITTED → DRAFT', () => {
      expect(sm.canTransition('SUBMITTED', 'DRAFT')).toBe(false);
    });

    it('should reject APPROVED → DRAFT', () => {
      expect(sm.canTransition('APPROVED', 'DRAFT')).toBe(false);
    });
  });

  describe('validateTransition', () => {
    it('should allow AUTHOR to submitForReview', () => {
      const t = sm.validateTransition('DRAFT', 'IN_REVIEW', 'AUTHOR');
      expect(t.action).toBe('submitForReview');
    });

    it('should allow REVIEWER to approve', () => {
      const t = sm.validateTransition('IN_REVIEW', 'APPROVED', 'REVIEWER');
      expect(t.action).toBe('approve');
    });

    it('should allow REVIEWER to requestChanges', () => {
      const t = sm.validateTransition('IN_REVIEW', 'DRAFT', 'REVIEWER');
      expect(t.action).toBe('requestChanges');
    });

    it('should allow AUTHOR to finalize', () => {
      const t = sm.validateTransition('APPROVED', 'FINALIZED', 'AUTHOR');
      expect(t.action).toBe('finalize');
    });

    it('should allow ADMIN to markSubmitted', () => {
      const t = sm.validateTransition('FINALIZED', 'SUBMITTED', 'ADMIN');
      expect(t.action).toBe('markSubmitted');
    });

    it('should reject REVIEWER submitting for review', () => {
      expect(() =>
        sm.validateTransition('DRAFT', 'IN_REVIEW', 'REVIEWER')
      ).toThrow(InsufficientRoleError);
    });

    it('should reject AUTHOR approving', () => {
      expect(() =>
        sm.validateTransition('IN_REVIEW', 'APPROVED', 'AUTHOR')
      ).toThrow(InsufficientRoleError);
    });

    it('should reject invalid transition', () => {
      expect(() =>
        sm.validateTransition('DRAFT', 'APPROVED', 'AUTHOR')
      ).toThrow(InvalidTransitionError);
    });
  });

  describe('executeAction', () => {
    it('should return IN_REVIEW for submitForReview from DRAFT', () => {
      expect(sm.executeAction('DRAFT', 'submitForReview', 'AUTHOR')).toBe('IN_REVIEW');
    });

    it('should return DRAFT for requestChanges from IN_REVIEW', () => {
      expect(sm.executeAction('IN_REVIEW', 'requestChanges', 'REVIEWER')).toBe('DRAFT');
    });

    it('should return APPROVED for approve from IN_REVIEW', () => {
      expect(sm.executeAction('IN_REVIEW', 'approve', 'REVIEWER')).toBe('APPROVED');
    });

    it('should return FINALIZED for finalize from APPROVED', () => {
      expect(sm.executeAction('APPROVED', 'finalize', 'AUTHOR')).toBe('FINALIZED');
    });

    it('should return SUBMITTED for markSubmitted from FINALIZED', () => {
      expect(sm.executeAction('FINALIZED', 'markSubmitted', 'ADMIN')).toBe('SUBMITTED');
    });

    it('should throw for wrong starting status', () => {
      expect(() =>
        sm.executeAction('APPROVED', 'submitForReview', 'AUTHOR')
      ).toThrow(InvalidTransitionError);
    });

    it('should throw for wrong role', () => {
      expect(() =>
        sm.executeAction('DRAFT', 'submitForReview', 'REVIEWER')
      ).toThrow(InsufficientRoleError);
    });

    it('should throw for unknown action', () => {
      expect(() =>
        sm.executeAction('DRAFT', 'unknownAction', 'AUTHOR')
      ).toThrow('Unknown action: unknownAction');
    });
  });

  describe('getValidTransitions', () => {
    it('should return one transition from DRAFT', () => {
      const t = sm.getValidTransitions('DRAFT');
      expect(t).toHaveLength(1);
      expect(t[0].to).toBe('IN_REVIEW');
    });

    it('should return two transitions from IN_REVIEW', () => {
      const t = sm.getValidTransitions('IN_REVIEW');
      expect(t).toHaveLength(2);
    });

    it('should return no transitions from SUBMITTED', () => {
      const t = sm.getValidTransitions('SUBMITTED');
      expect(t).toHaveLength(0);
    });
  });

  describe('getAvailableActions', () => {
    it('should return submitForReview for AUTHOR in DRAFT', () => {
      const actions = sm.getAvailableActions('DRAFT', 'AUTHOR');
      expect(actions).toHaveLength(1);
      expect(actions[0].action).toBe('submitForReview');
    });

    it('should return approve and requestChanges for REVIEWER in IN_REVIEW', () => {
      const actions = sm.getAvailableActions('IN_REVIEW', 'REVIEWER');
      expect(actions).toHaveLength(2);
    });

    it('should return no actions for REVIEWER in DRAFT', () => {
      const actions = sm.getAvailableActions('DRAFT', 'REVIEWER');
      expect(actions).toHaveLength(0);
    });

    it('should return markSubmitted for ADMIN in FINALIZED', () => {
      const actions = sm.getAvailableActions('FINALIZED', 'ADMIN');
      expect(actions).toHaveLength(1);
      expect(actions[0].action).toBe('markSubmitted');
    });
  });
});
