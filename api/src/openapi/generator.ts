import { OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi';
import { registry } from './registry.js';

export function generateOpenAPISpec() {
  const generator = new OpenApiGeneratorV31(registry.definitions);

  return generator.generateDocument({
    openapi: '3.1.0',
    info: {
      title: 'AI Inspection API',
      version: '1.0.0',
      description: 'Backend API for the AI Building Inspection Assistant',
      contact: {
        name: 'Apexphere',
        url: 'https://github.com/apexphere/ai-inspection',
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
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Inspections', description: 'Inspection management' },
      { name: 'Projects', description: 'Project management' },
      { name: 'Properties', description: 'Property management' },
      { name: 'Findings', description: 'Inspection findings' },
      { name: 'Photos', description: 'Photo attachments' },
      { name: 'Reports', description: 'Report generation' },
    ],
  });
}
