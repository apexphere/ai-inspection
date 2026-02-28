import express, { type Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { healthRouter } from './routes/health.js';
import { authRouter } from './routes/auth.js';
import { inspectionsRouter } from './routes/inspections.js';
import { findingsRouter } from './routes/findings.js';
import { photosRouter } from './routes/photos.js';
import { reportsRouter } from './routes/reports.js';
import { reportManagementRouter } from './routes/report-management.js';
import { navigationRouter } from './routes/navigation.js';
import { projectsRouter } from './routes/projects.js';
import { propertiesRouter } from './routes/properties.js';
import { clientsRouter } from './routes/clients.js';
import { siteInspectionsRouter } from './routes/site-inspections.js';
import { checklistItemsRouter } from './routes/checklist-items.js';
import { buildingCodeRouter } from './routes/building-code.js';
import { clauseReviewsRouter } from './routes/clause-reviews.js';
import { documentsRouter } from './routes/documents.js';
import { naReasonTemplatesRouter } from './routes/na-reason-templates.js';
import { projectPhotosRouter } from './routes/project-photos.js';
import { buildingHistoryRouter } from './routes/building-history.js';
import { siteMeasurementsRouter } from './routes/site-measurements.js';
import { inspectorsRouter } from './routes/inspectors.js';
import { defectsRouter } from './routes/defects.js';
import { companiesRouter } from './routes/companies.js';
import { reportAuditLogRouter } from './routes/report-audit-log.js';
import { reportTransitionsRouter } from './routes/report-transitions.js';
import { moistureReadingsRouter } from './routes/moisture-readings.js';
import { costEstimatesRouter } from './routes/cost-estimates.js';
import { reportGenerationRouter } from './routes/report-generation.js';
import { startReportWorker, stopReportWorker } from './workers/report-worker.js';
import { reportTemplatesRouter } from './routes/report-templates.js';
import { reviewCommentsRouter } from './routes/review-comments.js';
import { generatedReportsRouter } from './routes/generated-reports.js';
import { personnelRouter } from './routes/personnel.js';
import { credentialsRouter } from './routes/credentials.js';
import { interactionLogsRouter } from './routes/interaction-logs.js';
import { openApiRouter } from './openapi/index.js';
import { authMiddleware, serviceAuthMiddleware } from './middleware/auth.js';
import { getAllowedOrigins } from './config/domain.js';
import { logStartupDiagnostics } from './config/startup.js';

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Trust first proxy (Fly.io reverse proxy)
// Required for express-rate-limit to work correctly with X-Forwarded-For header
app.set('trust proxy', 1);

// CORS configuration - generated from APP_DOMAIN env var
const allowedOrigins = getAllowedOrigins();

// Middleware
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g., mobile apps, curl)
    if (!origin) return callback(null, true);
    
    // Check against allowed origins
    const isAllowed = allowedOrigins.some(allowed => 
      allowed instanceof RegExp ? allowed.test(origin) : allowed === origin
    );
    
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error(`CORS not allowed for origin: ${origin}`));
    }
  },
  credentials: true, // Allow cookies
}));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' })); // Increased limit for base64 photos

// Public routes (no auth required)
app.use('/health', healthRouter);
app.use('/api', openApiRouter);  // OpenAPI docs (no auth required)
app.use('/api/auth', authRouter);

// Service routes (JWT or API key auth)
app.use('/api/inspectors', serviceAuthMiddleware, inspectorsRouter);

// Protected routes (auth required)
app.use('/api/inspections', authMiddleware, inspectionsRouter);
app.use('/api', authMiddleware, findingsRouter);
app.use('/api', authMiddleware, photosRouter);
app.use('/api', authMiddleware, reportsRouter);
app.use('/api/reports', authMiddleware, reportManagementRouter);
app.use('/api/reports', authMiddleware, reportTransitionsRouter);
app.use('/api', authMiddleware, navigationRouter);
app.use('/api/projects', authMiddleware, projectsRouter);
app.use('/api/properties', authMiddleware, propertiesRouter);
app.use('/api/clients', authMiddleware, clientsRouter);
app.use('/api/personnel', authMiddleware, personnelRouter);
app.use('/api', authMiddleware, siteInspectionsRouter);
app.use('/api', authMiddleware, checklistItemsRouter);
app.use('/api/building-code', authMiddleware, buildingCodeRouter);
app.use('/api', authMiddleware, clauseReviewsRouter);
app.use('/api', authMiddleware, documentsRouter);
app.use('/api/na-reason-templates', authMiddleware, naReasonTemplatesRouter);
app.use('/api', authMiddleware, projectPhotosRouter);
app.use('/api', authMiddleware, buildingHistoryRouter);
app.use('/api', authMiddleware, siteMeasurementsRouter);
app.use('/api', authMiddleware, defectsRouter);
app.use('/api/companies', authMiddleware, companiesRouter);
app.use('/api', authMiddleware, reportAuditLogRouter);
app.use('/api', authMiddleware, moistureReadingsRouter);
app.use('/api', authMiddleware, costEstimatesRouter);
app.use('/api', authMiddleware, reportGenerationRouter);
app.use('/api', authMiddleware, reportTemplatesRouter);
app.use('/api', authMiddleware, reviewCommentsRouter);
app.use('/api/reports', authMiddleware, generatedReportsRouter);
app.use('/api', authMiddleware, credentialsRouter);
app.use('/api/interaction-logs', serviceAuthMiddleware, interactionLogsRouter);

// Error handling with detailed logging
app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  // Log with context
  console.error('=== API Error ===');
  console.error(`Method: ${req.method}`);
  console.error(`Path: ${req.path}`);
  console.error(`Error: ${err.message}`);
  console.error(`Stack: ${err.stack}`);
  console.error('=================');
  
  // Check for common issues and provide hints
  const message = err.message.toLowerCase();
  if (message.includes('prisma') || message.includes('database') || message.includes('connect')) {
    console.error('💡 Hint: Check DATABASE_URL is set correctly');
  }
  
  res.status(500).json({ error: 'Internal server error' });
});

// Start server with diagnostics
async function start(): Promise<void> {
  await logStartupDiagnostics();

  // Start background workers
  await startReportWorker();

  const server = app.listen(PORT, () => {
    console.log(`API server running on port ${PORT}`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    console.log(`\n[Server] ${signal} received — shutting down gracefully`);
    server.close(async () => {
      await stopReportWorker();
      process.exit(0);
    });
  };

  process.once('SIGTERM', () => shutdown('SIGTERM'));
  process.once('SIGINT', () => shutdown('SIGINT'));
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export { app };
