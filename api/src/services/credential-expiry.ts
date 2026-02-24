/**
 * Credential Expiry Alert Service — Issue #202
 *
 * Detects credentials expiring within a configurable threshold
 * and categorises them by urgency level.
 */

import type { PrismaClient, Credential, Personnel, CredentialType } from '@prisma/client';

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

export type AlertLevel = 'INFO' | 'WARNING' | 'URGENT' | 'EXPIRED';

export interface ExpiringCredential {
  credentialId: string;
  credentialType: CredentialType;
  registrationTitle: string | null;
  licenseNumber: string | null;
  expiryDate: Date;
  daysUntilExpiry: number;
  alertLevel: AlertLevel;
  personnel: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    mobile: string | null;
    role: string;
  };
}

export interface ExpiryQueryParams {
  days?: number;
  personnelId?: string;
  credentialType?: CredentialType;
  alertLevel?: AlertLevel;
}

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Determine alert level based on days until expiry.
 */
export function getAlertLevel(daysUntilExpiry: number): AlertLevel {
  if (daysUntilExpiry <= 0) return 'EXPIRED';
  if (daysUntilExpiry <= 30) return 'URGENT';
  if (daysUntilExpiry <= 60) return 'WARNING';
  return 'INFO';
}

/**
 * Calculate days between now and expiry date.
 */
export function daysUntilDate(expiryDate: Date, now: Date = new Date()): number {
  const diff = expiryDate.getTime() - now.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

// ──────────────────────────────────────────────────────────────────────────────
// Service
// ──────────────────────────────────────────────────────────────────────────────

export class CredentialExpiryService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Find all credentials expiring within the given number of days.
   * Returns results ordered by expiry date (soonest first).
   * Only includes active personnel.
   */
  async findExpiring(params: ExpiryQueryParams = {}): Promise<ExpiringCredential[]> {
    const days = params.days ?? 90;
    const now = new Date();
    const threshold = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const where: Record<string, unknown> = {
      expiryDate: { lte: threshold },
      personnel: { active: true },
    };

    if (params.personnelId) {
      where.personnelId = params.personnelId;
    }
    if (params.credentialType) {
      where.credentialType = params.credentialType;
    }

    const credentials = await this.prisma.credential.findMany({
      where,
      include: {
        personnel: true,
      },
      orderBy: { expiryDate: 'asc' },
    });

    const results: ExpiringCredential[] = credentials
      .filter((c): c is Credential & { personnel: Personnel; expiryDate: Date } => c.expiryDate !== null)
      .map((c) => {
        const daysLeft = daysUntilDate(c.expiryDate, now);
        const alertLevel = getAlertLevel(daysLeft);

        return {
          credentialId: c.id,
          credentialType: c.credentialType,
          registrationTitle: c.registrationTitle,
          licenseNumber: c.licenseNumber,
          expiryDate: c.expiryDate,
          daysUntilExpiry: daysLeft,
          alertLevel,
          personnel: {
            id: c.personnel.id,
            name: c.personnel.name,
            email: c.personnel.email,
            phone: c.personnel.phone,
            mobile: c.personnel.mobile,
            role: c.personnel.role,
          },
        };
      });

    // Filter by alert level if specified
    if (params.alertLevel) {
      return results.filter((r) => r.alertLevel === params.alertLevel);
    }

    return results;
  }

  /**
   * Get summary counts by alert level.
   */
  async getSummary(days?: number): Promise<Record<AlertLevel, number>> {
    const results = await this.findExpiring({ days });
    const summary: Record<AlertLevel, number> = {
      INFO: 0,
      WARNING: 0,
      URGENT: 0,
      EXPIRED: 0,
    };

    for (const r of results) {
      summary[r.alertLevel]++;
    }

    return summary;
  }
}
