/**
 * OpenAPI Schema Registry
 * 
 * Import all schema files to register them with the OpenAPI registry.
 * Issues #429, #431
 */

// Core endpoint schemas
export * from './inspection.js';
export * from './finding.js';
export * from './photo.js';
export * from './report.js';

// Supporting endpoint schemas
export * from './project.js';
export * from './client.js';
export * from './inspector.js';

// Reference endpoint schemas
export * from './health.js';
export * from './building-code.js';
