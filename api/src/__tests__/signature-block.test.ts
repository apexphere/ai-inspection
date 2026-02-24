/**
 * Signature Block Generator Tests — Issue #203
 */

import { describe, it, expect } from 'vitest';
import { generateSignatureBlock, type GenerateSignatureBlockInput } from '../services/signature-block.js';

describe('signature-block', () => {
  const baseAuthor: GenerateSignatureBlockInput['author'] = {
    id: 'auth-1',
    name: 'Ian Fong',
    credentials: [
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
    ],
  };

  const baseReviewer: GenerateSignatureBlockInput['author'] = {
    id: 'rev-1',
    name: 'Jake Li',
    credentials: [
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
        qualifications: ['MCon. Mgt.'],
      },
    ],
  };

  it('generates author block with name, credentials, and company', () => {
    const result = generateSignatureBlock({
      author: baseAuthor,
      companyName: 'Apex Inspection Services',
    });

    expect(result.author.name).toBe('Ian Fong');
    expect(result.author.credentials).toBe(
      'Registered Building Surveyor, MNZIBS, Dip. Building Surveying, BE (Hons), MBA',
    );
    expect(result.author.company).toBe('Apex Inspection Services');
    expect(result.author.signatureLine).toBe('_________________________');
  });

  it('generates reviewer block when provided', () => {
    const result = generateSignatureBlock({
      author: baseAuthor,
      reviewer: baseReviewer,
      companyName: 'Apex Inspection Services',
    });

    expect(result.reviewer).not.toBeNull();
    expect(result.reviewer!.name).toBe('Jake Li');
    expect(result.reviewer!.credentials).toBe('Building Surveyor, MCon. Mgt.');
    expect(result.reviewer!.company).toBe('Apex Inspection Services');
  });

  it('sets reviewer to null when not provided', () => {
    const result = generateSignatureBlock({
      author: baseAuthor,
      companyName: 'Apex Inspection Services',
    });

    expect(result.reviewer).toBeNull();
  });

  it('sets reviewer to null when explicitly null', () => {
    const result = generateSignatureBlock({
      author: baseAuthor,
      reviewer: null,
      companyName: 'Apex Inspection Services',
    });

    expect(result.reviewer).toBeNull();
  });

  it('handles author with no credentials', () => {
    const result = generateSignatureBlock({
      author: { id: 'a', name: 'John Doe', credentials: [] },
      companyName: 'Test Co',
    });

    expect(result.author.name).toBe('John Doe');
    expect(result.author.credentials).toBe('');
    expect(result.author.company).toBe('Test Co');
  });

  it('handles empty company name', () => {
    const result = generateSignatureBlock({
      author: baseAuthor,
      companyName: '',
    });

    expect(result.author.company).toBe('');
  });

  it('includes signature line on both author and reviewer', () => {
    const result = generateSignatureBlock({
      author: baseAuthor,
      reviewer: baseReviewer,
      companyName: 'Test',
    });

    expect(result.author.signatureLine).toBeTruthy();
    expect(result.reviewer!.signatureLine).toBeTruthy();
  });
});
