/**
 * Report State Machine — Issue #210
 * 
 * Enforces valid status transitions and role-based permissions
 * for the report lifecycle workflow.
 * 
 * States: DRAFT → IN_REVIEW → APPROVED → FINALIZED → SUBMITTED
 *         IN_REVIEW → DRAFT (request changes)
 */

import type { ReportStatus } from '@prisma/client';

// ============================================
// Role Definitions
// ============================================

export type ReportRole = 'AUTHOR' | 'REVIEWER' | 'ADMIN';

// ============================================
// Transition Definition
// ============================================

export interface TransitionDef {
  from: ReportStatus;
  to: ReportStatus;
  action: string;
  allowedRoles: ReportRole[];
}

// ============================================
// State Machine Configuration
// ============================================

const TRANSITIONS: TransitionDef[] = [
  { from: 'DRAFT', to: 'IN_REVIEW', action: 'submitForReview', allowedRoles: ['AUTHOR'] },
  { from: 'IN_REVIEW', to: 'DRAFT', action: 'requestChanges', allowedRoles: ['REVIEWER'] },
  { from: 'IN_REVIEW', to: 'APPROVED', action: 'approve', allowedRoles: ['REVIEWER'] },
  { from: 'APPROVED', to: 'FINALIZED', action: 'finalize', allowedRoles: ['AUTHOR'] },
  { from: 'FINALIZED', to: 'SUBMITTED', action: 'markSubmitted', allowedRoles: ['ADMIN'] },
];

// ============================================
// Errors
// ============================================

export class InvalidTransitionError extends Error {
  constructor(from: ReportStatus, to: ReportStatus) {
    super(`Invalid transition: ${from} → ${to}`);
    this.name = 'InvalidTransitionError';
  }
}

export class InsufficientRoleError extends Error {
  constructor(role: ReportRole, action: string) {
    super(`Role '${role}' cannot perform action '${action}'`);
    this.name = 'InsufficientRoleError';
  }
}

// ============================================
// State Machine
// ============================================

export class ReportStateMachine {
  /**
   * Check if a transition from one status to another is valid.
   */
  canTransition(from: ReportStatus, to: ReportStatus): boolean {
    return TRANSITIONS.some(t => t.from === from && t.to === to);
  }

  /**
   * Check if a role can perform a specific action.
   */
  canPerformAction(role: ReportRole, action: string): boolean {
    const transition = TRANSITIONS.find(t => t.action === action);
    if (!transition) return false;
    return transition.allowedRoles.includes(role);
  }

  /**
   * Get all valid transitions from a given status.
   */
  getValidTransitions(from: ReportStatus): TransitionDef[] {
    return TRANSITIONS.filter(t => t.from === from);
  }

  /**
   * Get the available actions for a given status and role.
   */
  getAvailableActions(from: ReportStatus, role: ReportRole): TransitionDef[] {
    return TRANSITIONS.filter(
      t => t.from === from && t.allowedRoles.includes(role)
    );
  }

  /**
   * Validate and return the target status for a transition.
   * Throws if the transition is invalid or the role is not allowed.
   */
  validateTransition(
    from: ReportStatus,
    to: ReportStatus,
    role: ReportRole
  ): TransitionDef {
    const transition = TRANSITIONS.find(t => t.from === from && t.to === to);
    
    if (!transition) {
      throw new InvalidTransitionError(from, to);
    }

    if (!transition.allowedRoles.includes(role)) {
      throw new InsufficientRoleError(role, transition.action);
    }

    return transition;
  }

  /**
   * Execute a named action from a given status with role checking.
   * Returns the target status.
   */
  executeAction(
    from: ReportStatus,
    action: string,
    role: ReportRole
  ): ReportStatus {
    const transition = TRANSITIONS.find(t => t.action === action);

    if (!transition) {
      throw new Error(`Unknown action: ${action}`);
    }

    if (transition.from !== from) {
      throw new InvalidTransitionError(from, transition.to);
    }

    if (!transition.allowedRoles.includes(role)) {
      throw new InsufficientRoleError(role, action);
    }

    return transition.to;
  }

  /**
   * Get all defined transitions (for documentation/API).
   */
  getAllTransitions(): TransitionDef[] {
    return [...TRANSITIONS];
  }
}
