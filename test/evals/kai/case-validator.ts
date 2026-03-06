import { EvalCase } from './types';

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

export function validateEvalCase(raw: unknown): { valid: true; value: EvalCase } | { valid: false; errors: string[] } {
  const errors: string[] = [];

  if (!isObject(raw)) return { valid: false, errors: ['Case must be an object'] };

  const requiredTopLevel = ['id', 'name', 'scenario', 'input', 'expected', 'mockResponse'];
  for (const key of requiredTopLevel) {
    if (!(key in raw)) errors.push(`Missing required field: ${key}`);
  }

  if (typeof raw.id !== 'string' || !raw.id) errors.push('id must be a non-empty string');
  if (typeof raw.name !== 'string' || !raw.name) errors.push('name must be a non-empty string');
  if (!isObject(raw.input)) errors.push('input must be an object');
  if (!isObject(raw.expected)) errors.push('expected must be an object');
  if (!isObject(raw.mockResponse)) errors.push('mockResponse must be an object');

  if (isObject(raw.expected)) {
    if (!Array.isArray(raw.expected.requiredChecklistItems)) errors.push('expected.requiredChecklistItems must be an array');
    if (!Array.isArray(raw.expected.expectedDefects)) errors.push('expected.expectedDefects must be an array');
    if (!Array.isArray(raw.expected.requiredReportSections)) errors.push('expected.requiredReportSections must be an array');
  }

  if (isObject(raw.mockResponse)) {
    if (!Array.isArray(raw.mockResponse.checklist)) errors.push('mockResponse.checklist must be an array');
    if (!Array.isArray(raw.mockResponse.defects)) errors.push('mockResponse.defects must be an array');
    if (!isObject(raw.mockResponse.report)) errors.push('mockResponse.report must be an object');
  }

  if (errors.length > 0) return { valid: false, errors };
  return { valid: true, value: raw as EvalCase };
}
