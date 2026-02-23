/**
 * OpenAPI Route Registry
 * 
 * Import all route files to register them with the OpenAPI registry.
 * Issue #431
 */

// Core routes
import './inspections.js';
import './findings.js';
import './photos.js';
import './reports.js';

// Supporting routes
import './projects.js';
import './clients.js';
import './inspectors.js';

// Reference routes
import './health.js';
import './building-code.js';
