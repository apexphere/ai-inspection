/**
 * OpenAPI Schema Registry
 * 
 * Import all schema files to register them with the OpenAPI registry.
 * Issue #429, #431
 */

// Common schemas (errors, pagination)
export * from './common.js';

// Core endpoint schemas
export * from './inspection.js';
export * from './finding.js';
export * from './photo.js';
export * from './report.js';
