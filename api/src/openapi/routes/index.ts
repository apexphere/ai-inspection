/**
 * OpenAPI Route Registry
 * 
 * Import all route files to register them with the OpenAPI registry.
 * Issues #431, #453
 */

// Auth (no auth required)
import './auth.js';

// Core routes
import './inspections.js';
import './findings.js';
import './photos.js';
import './reports.js';

// Project management
import './projects.js';
import './properties.js';
import './clients.js';
import './documents.js';
import './project-photos.js';

// Site inspection workflow
import './site-inspections.js';
import './checklist-items.js';
import './clause-reviews.js';
import './site-measurements.js';
import './navigation.js';

// Reference data
import './inspectors.js';
import './health.js';
import './building-code.js';
import './building-history.js';
import './na-reason-templates.js';

// Sprint 4c routes
import './personnel.js';
import './companies.js';
import './report-management.js';
import './report-generation.js';
import './report-templates.js';
import './review-comments.js';
import './defects.js';
import './interaction-logs.js';
