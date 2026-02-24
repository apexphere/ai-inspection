/**
 * Variable Substitution Engine
 *
 * Resolves [Variable Name] placeholders in report templates to actual values.
 * Uses an allowlist approach for security — only known variables are substituted.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface VariableContext {
  project: {
    address: string;
    activity: string;
    jobNumber: string;
    reportType: string;
  };
  property: {
    lotDp: string;
    councilPropertyId: string;
    territorialAuthority: string;
  };
  client: {
    name: string;
    address: string;
    phone: string;
    email: string;
    contactPerson: string;
  };
  company: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
  personnel: {
    inspectorName: string;
    authorName: string;
    authorCredentials: string;
    reviewerName: string;
    reviewerCredentials: string;
  };
  inspection: {
    date: string;
    weather: string;
  };
}

export interface SubstitutionResult {
  content: string;
  warnings: string[];
  substitutionCount: number;
  missingVariables: string[];
}

export interface VariableInfo {
  name: string;
  path: string;
  description: string;
}

export interface ValidationResult {
  valid: string[];
  unknown: string[];
}

// ─── HTML Escaping ───────────────────────────────────────────────────────────

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ─── Variable Map ────────────────────────────────────────────────────────────

type VariableResolver = (ctx: VariableContext) => string;

const VARIABLE_MAP: Record<string, VariableResolver> = {
  // Company
  'Company Name': (ctx) => ctx.company.name,
  'Company Address': (ctx) => ctx.company.address,
  'Company Phone': (ctx) => ctx.company.phone,
  'Company Email': (ctx) => ctx.company.email,

  // Project / Property
  'Address': (ctx) => ctx.project.address,
  'Territorial Authority': (ctx) => ctx.property.territorialAuthority,
  'Report Type': (ctx) => ctx.project.reportType,
  'Job Number': (ctx) => ctx.project.jobNumber,
  'Activity': (ctx) => ctx.project.activity,
  'Lot DP': (ctx) => ctx.property.lotDp,
  'Council Property ID': (ctx) => ctx.property.councilPropertyId,

  // Client
  'Client Name': (ctx) => ctx.client.name,
  'Client Address': (ctx) => ctx.client.address,
  'Client Phone': (ctx) => ctx.client.phone,
  'Client Email': (ctx) => ctx.client.email,
  'Contact Person': (ctx) => ctx.client.contactPerson,

  // Personnel
  'Inspector Name': (ctx) => ctx.personnel.inspectorName,
  'Author Name': (ctx) => ctx.personnel.authorName,
  'Author Credentials': (ctx) => ctx.personnel.authorCredentials,
  'Reviewer Name': (ctx) => ctx.personnel.reviewerName,
  'Reviewer Credentials': (ctx) => ctx.personnel.reviewerCredentials,

  // Inspection
  'Inspection Date': (ctx) => ctx.inspection.date,
  'Weather': (ctx) => ctx.inspection.weather,
};

// Variable descriptions for documentation
const VARIABLE_DESCRIPTIONS: Record<string, string> = {
  'Company Name': 'The name of the inspection company',
  'Company Address': 'The address of the inspection company',
  'Company Phone': 'The phone number of the inspection company',
  'Company Email': 'The email address of the inspection company',
  'Address': 'The property address being inspected',
  'Territorial Authority': 'The local council or territorial authority',
  'Report Type': 'The type of report (COA, PPI, etc.)',
  'Job Number': 'The unique job reference number',
  'Activity': 'The type of activity or inspection purpose',
  'Lot DP': 'The lot and deposited plan reference',
  'Council Property ID': 'The council property identifier',
  'Client Name': 'The name of the client',
  'Client Address': 'The address of the client',
  'Client Phone': 'The phone number of the client',
  'Client Email': 'The email address of the client',
  'Contact Person': 'The primary contact person for the client',
  'Inspector Name': 'The name of the inspector who conducted the inspection',
  'Author Name': 'The name of the report author',
  'Author Credentials': 'The professional credentials of the author',
  'Reviewer Name': 'The name of the report reviewer',
  'Reviewer Credentials': 'The professional credentials of the reviewer',
  'Inspection Date': 'The date of the inspection',
  'Weather': 'The weather conditions during the inspection',
};

// Variable paths for documentation
const VARIABLE_PATHS: Record<string, string> = {
  'Company Name': 'company.name',
  'Company Address': 'company.address',
  'Company Phone': 'company.phone',
  'Company Email': 'company.email',
  'Address': 'project.address',
  'Territorial Authority': 'property.territorialAuthority',
  'Report Type': 'project.reportType',
  'Job Number': 'project.jobNumber',
  'Activity': 'project.activity',
  'Lot DP': 'property.lotDp',
  'Council Property ID': 'property.councilPropertyId',
  'Client Name': 'client.name',
  'Client Address': 'client.address',
  'Client Phone': 'client.phone',
  'Client Email': 'client.email',
  'Contact Person': 'client.contactPerson',
  'Inspector Name': 'personnel.inspectorName',
  'Author Name': 'personnel.authorName',
  'Author Credentials': 'personnel.authorCredentials',
  'Reviewer Name': 'personnel.reviewerName',
  'Reviewer Credentials': 'personnel.reviewerCredentials',
  'Inspection Date': 'inspection.date',
  'Weather': 'inspection.weather',
};

// ─── Public Functions ────────────────────────────────────────────────────────

/**
 * Extract all [Variable Name] placeholders from content.
 * Returns a unique list of variable names (without brackets).
 */
export function extractVariables(content: string): string[] {
  if (!content) return [];

  const regex = /\[([^\]]+)\]/g;
  const matches = new Set<string>();

  let match: RegExpExecArray | null;
  while ((match = regex.exec(content)) !== null) {
    matches.add(match[1]);
  }

  return Array.from(matches);
}

/**
 * Substitute all [Variable Name] placeholders with actual values.
 * Unknown variables are replaced with [MISSING: variableName].
 * All substituted values are HTML-escaped.
 */
export function substituteVariables(
  content: string,
  context: VariableContext
): SubstitutionResult {
  const warnings: string[] = [];
  const missingVariables: string[] = [];
  let substitutionCount = 0;

  const result = content.replace(/\[([^\]]+)\]/g, (_match, variableName: string) => {
    const resolver = VARIABLE_MAP[variableName];

    if (!resolver) {
      warnings.push(`Unknown variable: ${variableName}`);
      missingVariables.push(variableName);
      return `[MISSING: ${variableName}]`;
    }

    const value = resolver(context);

    if (!value) {
      warnings.push(`Empty value for variable: ${variableName}`);
      missingVariables.push(variableName);
      return `[MISSING: ${variableName}]`;
    }

    substitutionCount++;
    return escapeHtml(value);
  });

  return {
    content: result,
    warnings,
    substitutionCount,
    missingVariables,
  };
}

/**
 * Get list of all available variables with their paths and descriptions.
 */
export function getAvailableVariables(): VariableInfo[] {
  return Object.keys(VARIABLE_MAP).map((name) => ({
    name,
    path: VARIABLE_PATHS[name],
    description: VARIABLE_DESCRIPTIONS[name],
  }));
}

/**
 * Validate a list of variable names.
 * Returns which are known (valid) and which are unknown.
 */
export function validateVariables(variableNames: string[]): ValidationResult {
  const valid: string[] = [];
  const unknown: string[] = [];

  for (const name of variableNames) {
    if (VARIABLE_MAP[name]) {
      valid.push(name);
    } else {
      unknown.push(name);
    }
  }

  return { valid, unknown };
}
