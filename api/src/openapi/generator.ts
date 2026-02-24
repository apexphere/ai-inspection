import { OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi';
import { registry } from './registry.js';

export function generateOpenAPISpec() {
  const generator = new OpenApiGeneratorV31(registry.definitions);

  const spec = generator.generateDocument({
    openapi: '3.1.0',
    info: {
      title: 'AI Inspection API',
      version: '1.0.0',
      description: `Backend API for the AI Building Inspection Assistant.

## Overview
This API powers the AI-assisted building inspection workflow:
- **Inspections** — Create and manage property inspections
- **Findings** — Record observations during inspections
- **Photos** — Attach photos to findings
- **Reports** — Generate PDF inspection reports

## Authentication
Most endpoints require JWT authentication via cookie or Bearer token.
Service endpoints (e.g., inspector lookup) accept \`X-API-Key\` header.

## Workflow
1. Create inspection with address and client info
2. Navigate through sections (exterior → interior → services)
3. Add findings with severity levels
4. Attach photos to findings
5. Generate final report`,
      contact: {
        name: 'Apexphere',
        url: 'https://github.com/apexphere/ai-inspection',
        email: 'support@apexphere.co.nz',
      },
      license: {
        name: 'Proprietary',
      },
    },
    servers: [
      {
        url: 'https://api-test-ai-inspection.apexphere.co.nz',
        description: 'Test environment',
      },
      {
        url: 'http://localhost:3000',
        description: 'Local development',
      },
    ],
    tags: [
      { name: 'Health', description: 'Health check endpoints' },
      { name: 'Auth', description: 'Authentication and account linking' },
      { name: 'Projects', description: 'Project management' },
      { name: 'Properties', description: 'Property management' },
      { name: 'Clients', description: 'Client management' },
      { name: 'Documents', description: 'Project document management' },
      { name: 'Project Photos', description: 'Project photo attachments' },
      { name: 'Inspections', description: 'Inspection management' },
      { name: 'Site Inspections', description: 'On-site inspection visits' },
      { name: 'Checklist Items', description: 'Inspection checklist items' },
      { name: 'Clause Reviews', description: 'Building code clause compliance reviews' },
      { name: 'Site Measurements', description: 'On-site measurements (moisture, etc.)' },
      { name: 'Navigation', description: 'Inspection workflow navigation' },
      { name: 'Findings', description: 'Inspection findings' },
      { name: 'Photos', description: 'Finding photo attachments' },
      { name: 'Reports', description: 'Report generation' },
      { name: 'Inspectors', description: 'Inspector lookup (service auth)' },
      { name: 'Building Code', description: 'NZ Building Code reference data' },
      { name: 'Building History', description: 'Property building history events' },
      { name: 'Reference Data', description: 'Shared reference data (NA reasons, etc.)' },
    ],
  });

  // Add security schemes to the generated spec
  return {
    ...spec,
    components: {
      ...spec.components,
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token from /api/auth/login',
        },
        apiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'Service API key for service-to-service auth',
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'token',
          description: 'JWT token in HTTP-only cookie',
        },
      },
    },
    security: [
      { bearerAuth: [] },
      { cookieAuth: [] },
    ],
  };
}
