/**
 * Credential String Formatter — Issue #201
 *
 * Formats personnel credentials into a single display string.
 * Order: Registration title, Memberships, Qualifications
 * Priority: NZIBS > ENG_NZ > LBP > ACADEMIC > OTHER
 */

import type { CredentialType } from '@prisma/client';

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

export interface CredentialInput {
  credentialType: CredentialType;
  registrationTitle: string | null;
  membershipCode: string | null;
  qualifications: string[];
}

// ──────────────────────────────────────────────────────────────────────────────
// Priority ordering
// ──────────────────────────────────────────────────────────────────────────────

const CREDENTIAL_PRIORITY: Record<CredentialType, number> = {
  NZIBS: 0,
  ENG_NZ: 1,
  LBP: 2,
  ACADEMIC: 3,
  OTHER: 4,
};

/**
 * Sort credentials by priority (NZIBS first, OTHER last).
 */
export function sortByPriority(credentials: CredentialInput[]): CredentialInput[] {
  return [...credentials].sort(
    (a, b) => CREDENTIAL_PRIORITY[a.credentialType] - CREDENTIAL_PRIORITY[b.credentialType],
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Formatter
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Format a list of credentials into a display string.
 *
 * Output order:
 * 1. Registration titles (sorted by priority)
 * 2. Membership codes (sorted by priority)
 * 3. Qualifications (sorted by priority, flattened)
 *
 * Example: "Registered Building Surveyor, MNZIBS, BE (Hons), MBA"
 *
 * Returns empty string if no credentials or all fields are empty.
 */
export function formatCredentials(credentials: CredentialInput[]): string {
  if (!credentials || credentials.length === 0) {
    return '';
  }

  const sorted = sortByPriority(credentials);

  const parts: string[] = [];

  // 1. Registration titles
  for (const cred of sorted) {
    if (cred.registrationTitle) {
      parts.push(cred.registrationTitle);
    }
  }

  // 2. Membership codes
  for (const cred of sorted) {
    if (cred.membershipCode) {
      parts.push(cred.membershipCode);
    }
  }

  // 3. Qualifications
  for (const cred of sorted) {
    for (const qual of cred.qualifications) {
      if (qual) {
        parts.push(qual);
      }
    }
  }

  return parts.join(', ');
}
