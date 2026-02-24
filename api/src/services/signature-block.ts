/**
 * Signature Block Generator — Issue #203
 *
 * Generates signature block data for report Section 7 (Declaration & Signatures).
 * Uses formatCredentials() from #201 for credential strings.
 */

import type { CredentialInput } from './credential-formatter.js';
import { formatCredentials } from './credential-formatter.js';

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

export interface PersonnelWithCredentials {
  id: string;
  name: string;
  credentials: CredentialInput[];
}

export interface SignatureEntry {
  name: string;
  credentials: string;
  company: string;
  signatureLine: string;
}

export interface SignatureBlock {
  author: SignatureEntry;
  reviewer: SignatureEntry | null;
}

export interface GenerateSignatureBlockInput {
  author: PersonnelWithCredentials;
  reviewer?: PersonnelWithCredentials | null;
  companyName: string;
}

// ──────────────────────────────────────────────────────────────────────────────
// Generator
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Build a single signature entry from personnel data.
 */
function buildEntry(
  personnel: PersonnelWithCredentials,
  companyName: string,
): SignatureEntry {
  return {
    name: personnel.name,
    credentials: formatCredentials(personnel.credentials),
    company: companyName,
    signatureLine: '_________________________',
  };
}

/**
 * Generate a signature block for a report.
 *
 * Always includes the author. Reviewer is optional.
 * Credential strings are formatted per #201 priority ordering.
 */
export function generateSignatureBlock(
  input: GenerateSignatureBlockInput,
): SignatureBlock {
  return {
    author: buildEntry(input.author, input.companyName),
    reviewer: input.reviewer
      ? buildEntry(input.reviewer, input.companyName)
      : null,
  };
}
