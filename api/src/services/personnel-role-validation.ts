/**
 * Personnel Role Validation Service — Issue #204
 *
 * Validates personnel assignments for report authoring and reviewing.
 * Only qualified personnel can be assigned based on their role.
 */

import type { PersonnelRole } from '@prisma/client';

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

export interface RoleCapabilities {
  canAuthor: boolean;
  canReview: boolean;
}

export interface PersonnelValidationInput {
  id: string;
  name: string;
  role: PersonnelRole;
  active: boolean;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// ──────────────────────────────────────────────────────────────────────────────
// Role Capabilities Matrix
// ──────────────────────────────────────────────────────────────────────────────

const ROLE_CAPABILITIES: Record<PersonnelRole, RoleCapabilities> = {
  REGISTERED_BUILDING_SURVEYOR: { canAuthor: true, canReview: true },
  BUILDING_SURVEYOR: { canAuthor: true, canReview: false },
  INSPECTOR: { canAuthor: false, canReview: false },
  ADMIN: { canAuthor: false, canReview: false },
};

/**
 * Role hierarchy for credential comparison (higher = more qualified).
 */
const ROLE_RANK: Record<PersonnelRole, number> = {
  REGISTERED_BUILDING_SURVEYOR: 3,
  BUILDING_SURVEYOR: 2,
  INSPECTOR: 1,
  ADMIN: 0,
};

// ──────────────────────────────────────────────────────────────────────────────
// Validation Functions
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Get capabilities for a given role.
 */
export function getRoleCapabilities(role: PersonnelRole): RoleCapabilities {
  return ROLE_CAPABILITIES[role];
}

/**
 * Check if a personnel can author reports.
 */
export function canAuthor(role: PersonnelRole): boolean {
  return ROLE_CAPABILITIES[role].canAuthor;
}

/**
 * Check if a personnel can review reports.
 */
export function canReview(role: PersonnelRole): boolean {
  return ROLE_CAPABILITIES[role].canReview;
}

/**
 * Validate a personnel assignment as report author.
 */
export function validateAuthor(personnel: PersonnelValidationInput): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!personnel.active) {
    errors.push(`${personnel.name} is inactive and cannot be assigned as author`);
  }

  if (!canAuthor(personnel.role)) {
    errors.push(`${personnel.name} (${personnel.role}) does not have authoring capability`);
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Validate a personnel assignment as report reviewer.
 */
export function validateReviewer(personnel: PersonnelValidationInput): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!personnel.active) {
    errors.push(`${personnel.name} is inactive and cannot be assigned as reviewer`);
  }

  if (!canReview(personnel.role)) {
    errors.push(`${personnel.name} (${personnel.role}) does not have reviewing capability`);
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Validate an author + reviewer assignment pair.
 * Warns if reviewer credentials are lower than author credentials.
 */
export function validateAssignment(
  author: PersonnelValidationInput,
  reviewer: PersonnelValidationInput,
): ValidationResult {
  const authorResult = validateAuthor(author);
  const reviewerResult = validateReviewer(reviewer);

  const errors = [...authorResult.errors, ...reviewerResult.errors];
  const warnings = [...authorResult.warnings, ...reviewerResult.warnings];

  // Warn if reviewer rank < author rank
  if (ROLE_RANK[reviewer.role] < ROLE_RANK[author.role]) {
    warnings.push(
      `Reviewer ${reviewer.name} (${reviewer.role}) has lower credentials than author ${author.name} (${author.role})`,
    );
  }

  // Warn if author and reviewer are the same person
  if (author.id === reviewer.id) {
    warnings.push('Author and reviewer are the same person');
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Get all roles that can author reports.
 */
export function getAuthorRoles(): PersonnelRole[] {
  return (Object.keys(ROLE_CAPABILITIES) as PersonnelRole[]).filter(
    (role) => ROLE_CAPABILITIES[role].canAuthor,
  );
}

/**
 * Get all roles that can review reports.
 */
export function getReviewerRoles(): PersonnelRole[] {
  return (Object.keys(ROLE_CAPABILITIES) as PersonnelRole[]).filter(
    (role) => ROLE_CAPABILITIES[role].canReview,
  );
}
