import { describe, it, expect } from 'vitest';
import {
  extractVariables,
  substituteVariables,
  getAvailableVariables,
  validateVariables,
  type VariableContext,
} from '../services/variable-substitution.js';

const createSampleContext = (overrides?: Partial<VariableContext>): VariableContext => ({
  project: {
    address: '123 Main Street',
    activity: 'Inspection',
    jobNumber: 'JOB-001',
    reportType: 'COA',
    ...overrides?.project,
  },
  property: {
    lotDp: 'Lot 1 DP 12345',
    councilPropertyId: 'CP-001',
    territorialAuthority: 'Auckland Council',
    ...overrides?.property,
  },
  client: {
    name: 'John Doe',
    address: '456 Client Ave',
    phone: '+64 21 555 1234',
    email: 'john@example.com',
    contactPerson: 'John Doe',
    ...overrides?.client,
  },
  company: {
    name: 'Acme Inspections',
    address: '789 Company Rd',
    phone: '+64 9 555 9999',
    email: 'info@acme.co.nz',
    ...overrides?.company,
  },
  personnel: {
    inspectorName: 'Jane Inspector',
    authorName: 'Jane Author',
    authorCredentials: 'LBP, NZIBS',
    reviewerName: 'Bob Reviewer',
    reviewerCredentials: 'LBP',
    ...overrides?.personnel,
  },
  inspection: {
    date: '25 February 2026',
    weather: 'Fine',
    ...overrides?.inspection,
  },
});

describe('Variable Substitution Engine', () => {
  // ─── extractVariables ──────────────────────────────────────────────────────

  describe('extractVariables', () => {
    it('should find all variables in content', () => {
      const content = 'Hello [Client Name], your report for [Address] is ready.';
      const vars = extractVariables(content);

      expect(vars).toContain('Client Name');
      expect(vars).toContain('Address');
      expect(vars).toHaveLength(2);
    });

    it('should handle duplicate variables', () => {
      const content = '[Client Name] at [Address] and again [Client Name]';
      const vars = extractVariables(content);

      expect(vars).toContain('Client Name');
      expect(vars).toContain('Address');
      expect(vars).toHaveLength(2); // duplicates removed
    });

    it('should handle empty content', () => {
      const vars = extractVariables('');
      expect(vars).toHaveLength(0);
    });

    it('should handle content with no variables', () => {
      const content = 'This is plain text without any variables.';
      const vars = extractVariables(content);
      expect(vars).toHaveLength(0);
    });

    it('should extract variables with special characters in names', () => {
      const content = '[Some Variable] and [Another One]';
      const vars = extractVariables(content);

      expect(vars).toContain('Some Variable');
      expect(vars).toContain('Another One');
    });
  });

  // ─── substituteVariables ───────────────────────────────────────────────────

  describe('substituteVariables', () => {
    it('should replace known variables with values', () => {
      const content = 'Client: [Client Name], Address: [Address]';
      const ctx = createSampleContext();

      const result = substituteVariables(content, ctx);

      expect(result.content).toBe('Client: John Doe, Address: 123 Main Street');
      expect(result.substitutionCount).toBe(2);
      expect(result.missingVariables).toHaveLength(0);
    });

    it('should mark unknown variables with [MISSING: ...]', () => {
      const content = 'Hello [Unknown Variable]';
      const ctx = createSampleContext();

      const result = substituteVariables(content, ctx);

      expect(result.content).toBe('Hello [MISSING: Unknown Variable]');
      expect(result.missingVariables).toContain('Unknown Variable');
      expect(result.warnings).toContain('Unknown variable: Unknown Variable');
    });

    it('should handle empty context values as missing', () => {
      const content = 'Weather: [Weather]';
      const ctx = createSampleContext({
        inspection: { date: '25 February 2026', weather: '' },
      });

      const result = substituteVariables(content, ctx);

      expect(result.content).toBe('Weather: [MISSING: Weather]');
      expect(result.missingVariables).toContain('Weather');
      expect(result.warnings).toContain('Empty value for variable: Weather');
    });

    it('should escape HTML in substituted values', () => {
      const content = 'Client: [Client Name]';
      const ctx = createSampleContext({
        client: {
          name: '<script>alert("xss")</script>',
          address: '456 Client Ave',
          phone: '+64 21 555 1234',
          email: 'john@example.com',
          contactPerson: 'John Doe',
        },
      });

      const result = substituteVariables(content, ctx);

      expect(result.content).toBe('Client: &lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
      expect(result.content).not.toContain('<script>');
    });

    it('should escape special HTML characters', () => {
      const content = 'Client: [Client Name]';
      const ctx = createSampleContext({
        client: {
          name: "O'Brien & Sons <Inc>",
          address: '456 Client Ave',
          phone: '+64 21 555 1234',
          email: 'john@example.com',
          contactPerson: 'John Doe',
        },
      });

      const result = substituteVariables(content, ctx);

      expect(result.content).toBe('Client: O&#39;Brien &amp; Sons &lt;Inc&gt;');
    });

    it('should return warnings for unknown variables', () => {
      const content = '[Client Name] [Foo Bar]';
      const ctx = createSampleContext();

      const result = substituteVariables(content, ctx);

      expect(result.warnings).toContain('Unknown variable: Foo Bar');
    });

    it('should count substitutions correctly', () => {
      const content = '[Client Name] at [Address] on [Inspection Date]';
      const ctx = createSampleContext();

      const result = substituteVariables(content, ctx);

      expect(result.substitutionCount).toBe(3);
    });

    it('should handle content with no variables', () => {
      const content = 'Plain text without variables.';
      const ctx = createSampleContext();

      const result = substituteVariables(content, ctx);

      expect(result.content).toBe('Plain text without variables.');
      expect(result.substitutionCount).toBe(0);
      expect(result.missingVariables).toHaveLength(0);
    });

    it('should substitute all known variable types', () => {
      const content = `
        Company: [Company Name]
        Company Address: [Company Address]
        Company Phone: [Company Phone]
        Company Email: [Company Email]
        Client: [Client Name]
        Client Address: [Client Address]
        Client Phone: [Client Phone]
        Client Email: [Client Email]
        Contact: [Contact Person]
        Address: [Address]
        Job: [Job Number]
        Activity: [Activity]
        Report Type: [Report Type]
        Lot: [Lot DP]
        Council ID: [Council Property ID]
        Authority: [Territorial Authority]
        Inspector: [Inspector Name]
        Author: [Author Name]
        Author Creds: [Author Credentials]
        Reviewer: [Reviewer Name]
        Reviewer Creds: [Reviewer Credentials]
        Date: [Inspection Date]
        Weather: [Weather]
      `;
      const ctx = createSampleContext();

      const result = substituteVariables(content, ctx);

      expect(result.substitutionCount).toBe(23);
      expect(result.missingVariables).toHaveLength(0);
      expect(result.content).toContain('Acme Inspections');
      expect(result.content).toContain('John Doe');
      expect(result.content).toContain('123 Main Street');
      expect(result.content).toContain('Jane Inspector');
    });
  });

  // ─── validateVariables ─────────────────────────────────────────────────────

  describe('validateVariables', () => {
    it('should identify known variables as valid', () => {
      const result = validateVariables(['Client Name', 'Address', 'Weather']);

      expect(result.valid).toContain('Client Name');
      expect(result.valid).toContain('Address');
      expect(result.valid).toContain('Weather');
      expect(result.unknown).toHaveLength(0);
    });

    it('should identify unknown variables', () => {
      const result = validateVariables(['Client Name', 'Unknown Var', 'Another Unknown']);

      expect(result.valid).toContain('Client Name');
      expect(result.unknown).toContain('Unknown Var');
      expect(result.unknown).toContain('Another Unknown');
    });

    it('should handle empty array', () => {
      const result = validateVariables([]);

      expect(result.valid).toHaveLength(0);
      expect(result.unknown).toHaveLength(0);
    });

    it('should handle all unknown variables', () => {
      const result = validateVariables(['Foo', 'Bar', 'Baz']);

      expect(result.valid).toHaveLength(0);
      expect(result.unknown).toHaveLength(3);
    });
  });

  // ─── getAvailableVariables ─────────────────────────────────────────────────

  describe('getAvailableVariables', () => {
    it('should return a non-empty list', () => {
      const variables = getAvailableVariables();
      expect(variables.length).toBeGreaterThan(0);
    });

    it('should include name, path, and description for each variable', () => {
      const variables = getAvailableVariables();

      for (const v of variables) {
        expect(v.name).toBeDefined();
        expect(v.path).toBeDefined();
        expect(v.description).toBeDefined();
        expect(v.name.length).toBeGreaterThan(0);
        expect(v.path.length).toBeGreaterThan(0);
        expect(v.description.length).toBeGreaterThan(0);
      }
    });

    it('should include expected variables', () => {
      const variables = getAvailableVariables();
      const names = variables.map((v) => v.name);

      expect(names).toContain('Client Name');
      expect(names).toContain('Address');
      expect(names).toContain('Company Name');
      expect(names).toContain('Inspector Name');
      expect(names).toContain('Weather');
    });

    it('should have valid paths referencing context structure', () => {
      const variables = getAvailableVariables();

      const validPrefixes = ['project.', 'property.', 'client.', 'company.', 'personnel.', 'inspection.'];

      for (const v of variables) {
        const hasValidPrefix = validPrefixes.some((prefix) => v.path.startsWith(prefix));
        expect(hasValidPrefix).toBe(true);
      }
    });
  });
});
