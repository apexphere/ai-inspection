import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { generateOpenAPISpec } from './generator.js';

export const openApiRouter = Router();

// Generate spec once at startup
const spec = generateOpenAPISpec();

// Serve OpenAPI JSON spec
openApiRouter.get('/openapi.json', (_req, res) => {
  res.json(spec);
});

// Serve Swagger UI
openApiRouter.use('/docs', swaggerUi.serve, swaggerUi.setup(spec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'AI Inspection API Docs',
}));

// Re-export for convenience
export { registry } from './registry.js';
export { generateOpenAPISpec } from './generator.js';
