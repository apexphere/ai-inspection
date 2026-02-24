/**
 * Credential Formatter Tests — Issue #201
 */

import { describe, it, expect } from 'vitest';
import { formatCredentials, sortByPriority, type CredentialInput } from '../services/credential-formatter.js';

describe('credential-formatter', () => {
  describe('sortByPriority', () => {
    it('sorts NZIBS before ENG_NZ before LBP before ACADEMIC before OTHER', () => {
      const creds: CredentialInput[] = [
        { credentialType: 'OTHER', registrationTitle: null, membershipCode: null, qualifications: [] },
        { credentialType: 'NZIBS', registrationTitle: null, membershipCode: null, qualifications: [] },
        { credentialType: 'ACADEMIC', registrationTitle: null, membershipCode: null, qualifications: [] },
        { credentialType: 'LBP', registrationTitle: null, membershipCode: null, qualifications: [] },
        { credentialType: 'ENG_NZ', registrationTitle: null, membershipCode: null, qualifications: [] },
      ];

      const sorted = sortByPriority(creds);
      expect(sorted.map(c => c.credentialType)).toEqual([
        'NZIBS', 'ENG_NZ', 'LBP', 'ACADEMIC', 'OTHER',
      ]);
    });

    it('does not mutate the original array', () => {
      const creds: CredentialInput[] = [
        { credentialType: 'OTHER', registrationTitle: null, membershipCode: null, qualifications: [] },
        { credentialType: 'NZIBS', registrationTitle: null, membershipCode: null, qualifications: [] },
      ];

      sortByPriority(creds);
      expect(creds[0].credentialType).toBe('OTHER');
    });
  });

  describe('formatCredentials', () => {
    it('formats Ian Fong example correctly', () => {
      const creds: CredentialInput[] = [
        {
          credentialType: 'NZIBS',
          registrationTitle: 'Registered Building Surveyor',
          membershipCode: 'MNZIBS',
          qualifications: ['Dip. Building Surveying'],
        },
        {
          credentialType: 'ACADEMIC',
          registrationTitle: null,
          membershipCode: null,
          qualifications: ['BE (Hons)', 'MBA'],
        },
      ];

      expect(formatCredentials(creds)).toBe(
        'Registered Building Surveyor, MNZIBS, Dip. Building Surveying, BE (Hons), MBA',
      );
    });

    it('formats Jake Li example correctly', () => {
      const creds: CredentialInput[] = [
        {
          credentialType: 'NZIBS',
          registrationTitle: 'Building Surveyor',
          membershipCode: null,
          qualifications: [],
        },
        {
          credentialType: 'ACADEMIC',
          registrationTitle: null,
          membershipCode: null,
          qualifications: ['MCon. Mgt.', 'M.Engin. (Safety)', 'BSc. (Materials)'],
        },
      ];

      expect(formatCredentials(creds)).toBe(
        'Building Surveyor, MCon. Mgt., M.Engin. (Safety), BSc. (Materials)',
      );
    });

    it('returns empty string for empty array', () => {
      expect(formatCredentials([])).toBe('');
    });

    it('returns empty string for null/undefined-like input', () => {
      expect(formatCredentials(null as unknown as CredentialInput[])).toBe('');
      expect(formatCredentials(undefined as unknown as CredentialInput[])).toBe('');
    });

    it('returns empty string when all fields are empty', () => {
      const creds: CredentialInput[] = [
        { credentialType: 'NZIBS', registrationTitle: null, membershipCode: null, qualifications: [] },
      ];

      expect(formatCredentials(creds)).toBe('');
    });

    it('orders registration titles before membership codes before qualifications', () => {
      const creds: CredentialInput[] = [
        {
          credentialType: 'NZIBS',
          registrationTitle: 'Registered Building Surveyor',
          membershipCode: 'MNZIBS',
          qualifications: ['BE (Hons)'],
        },
      ];

      const result = formatCredentials(creds);
      const parts = result.split(', ');
      expect(parts[0]).toBe('Registered Building Surveyor');
      expect(parts[1]).toBe('MNZIBS');
      expect(parts[2]).toBe('BE (Hons)');
    });

    it('handles credentials with only qualifications', () => {
      const creds: CredentialInput[] = [
        {
          credentialType: 'ACADEMIC',
          registrationTitle: null,
          membershipCode: null,
          qualifications: ['PhD', 'MSc'],
        },
      ];

      expect(formatCredentials(creds)).toBe('PhD, MSc');
    });

    it('handles credentials with only membership code', () => {
      const creds: CredentialInput[] = [
        {
          credentialType: 'ENG_NZ',
          registrationTitle: null,
          membershipCode: 'MEngNZ',
          qualifications: [],
        },
      ];

      expect(formatCredentials(creds)).toBe('MEngNZ');
    });

    it('sorts mixed credential types by priority', () => {
      const creds: CredentialInput[] = [
        {
          credentialType: 'ACADEMIC',
          registrationTitle: null,
          membershipCode: null,
          qualifications: ['MBA'],
        },
        {
          credentialType: 'NZIBS',
          registrationTitle: 'Registered Building Surveyor',
          membershipCode: 'MNZIBS',
          qualifications: [],
        },
      ];

      const result = formatCredentials(creds);
      // Registration title from NZIBS should come first
      expect(result).toBe('Registered Building Surveyor, MNZIBS, MBA');
    });

    it('skips empty qualification strings', () => {
      const creds: CredentialInput[] = [
        {
          credentialType: 'ACADEMIC',
          registrationTitle: null,
          membershipCode: null,
          qualifications: ['BE', '', 'MBA'],
        },
      ];

      expect(formatCredentials(creds)).toBe('BE, MBA');
    });
  });
});
