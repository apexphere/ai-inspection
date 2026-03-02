import { logger } from './lib/logger.js';
import { pinoHttp as PinoHttp, type Options as PinoHttpOptions } from 'pino-http';
import express, { type Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { healthRouter } from './routes/health.js';
import { authRouter } from './routes/auth.js';
import { inspectionsRouter } from './routes/inspections.js';
import { findingsRouter } from './routes/findings.js';
import { photosRouter } from './routes/photos.js';
import { photosPublicRouter } from './routes/photos-public.js';
import { reportsRouter } from './routes/reports.js';
import { reportManagementRouter } from './routes/report-management.js';
import { navigationRouter } from './routes/navigation.js';
import { projectsRouter } from './routes/projects.js';
import { propertiesRouter } from './routes/properties.js';
import { clientsRouter } from './routes/clients.js';
import { siteInspectionsRouter } from './routes/site-inspections.js';
import { floorPlansRouter } from './routes/floor-plans.js';
import { projectRequirementsRouter } from './routes/project-requirements.js';
import { sectionConclusionsRouter } from './routes/section-conclusions.js';
import { floorLevelSurveysRouter } from './routes/floor-level-surveys.js';
import { thermalImagingRouter } from './routes/thermal-imaging.js';
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
import { serviceKeysAdminRouter } from './routes/admin/service-keys.js';
import { openApiRouter } from './openapi/index.js';
import { authMiddleware, serviceAuthMiddleware, requireScope, requireAdmin } from './middleware/auth.js';
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

// Structured request logging — Issue #573
app.use(PinoHttp({
  logger,
  autoLogging: {
    ignore: (req) => req.url === '/health' || req.url === '/health/ready',
  },
  customSuccessMessage: (req, res) => `${req.method} ${req.url} ${res.statusCode}`,
  customErrorMessage: (req, res) => `${req.method} ${req.url} ${res.statusCode}`,
}));

// Public routes (no auth required)
app.use('/health', healthRouter);
app.use('/api', openApiRouter);  // OpenAPI docs (no auth required)
app.use('/api/auth', authRouter);
app.use('/api/photos', photosPublicRouter);  // Public photo serving (no auth) - #524

// Agent-accessible routes (JWT or scoped API key) — Issue #596
app.use('/api/projects', serviceAuthMiddleware, requireScope('projects:read'), projectsRouter);
app.use('/api/properties', serviceAuthMiddleware, requireScope('properties:read'), propertiesRouter);
app.use('/api/clients', serviceAuthMiddleware, requireScope('clients:read'), clientsRouter);
app.use('/api', serviceAuthMiddleware, requireScope('inspections:read'), siteInspectionsRouter);
app.use('/api', serviceAuthMiddleware, requireScope('checklist:read'), checklistItemsRouter);
app.use('/api/building-code', serviceAuthMiddleware, requireScope('building-code:read'), buildingCodeRouter);
app.use('/api', serviceAuthMiddleware, requireScope('clause-reviews:read'), clauseReviewsRouter);
app.use('/api', serviceAuthMiddleware, requireScope('photos:read'), projectPhotosRouter);
app.use('/api', serviceAuthMiddleware, requireScope('photos:read'), photosRouter);
app.use('/api/inspections', serviceAuthMiddleware, requireScope('inspections:read'), inspectionsRouter);
app.use('/api', serviceAuthMiddleware, requireScope('inspections:read'), findingsRouter);
app.use('/api', serviceAuthMiddleware, requireScope('inspections:read'), defectsRouter);
app.use('/api', serviceAuthMiddleware, requireScope('inspections:read'), buildingHistoryRouter);
app.use('/api', serviceAuthMiddleware, requireScope('inspections:read'), siteMeasurementsRouter);
app.use('/api', serviceAuthMiddleware, requireScope('inspections:read'), moistureReadingsRouter);
app.use('/api/project-requirements', serviceAuthMiddleware, requireScope('projects:read'), projectRequirementsRouter);
app.use('/api/projects/:id/floor-plans', serviceAuthMiddleware, requireScope('projects:read'), floorPlansRouter);
app.use('/api/site-inspections/:id/section-conclusions', serviceAuthMiddleware, requireScope('inspections:read'), sectionConclusionsRouter);
app.use('/api/site-inspections/:id/floor-level-surveys', serviceAuthMiddleware, requireScope('inspections:read'), floorLevelSurveysRouter);
app.use('/api/site-inspections/:id/thermal-imaging', serviceAuthMiddleware, requireScope('inspections:read'), thermalImagingRouter);
app.use('/api/inspectors', serviceAuthMiddleware, requireScope('inspections:read'), inspectorsRouter);
app.use('/api/interaction-logs', serviceAuthMiddleware, requireScope('inspections:read'), interactionLogsRouter);

// Protected routes — JWT only (never service-accessible) — Issue #596
app.use('/api/personnel', authMiddleware, personnelRouter);
app.use('/api', authMiddleware, credentialsRouter);
app.use('/api/companies', authMiddleware, companiesRouter);
app.use('/api/reports', authMiddleware, reportManagementRouter);
app.use('/api/reports', authMiddleware, reportTransitionsRouter);
app.use('/api', authMiddleware, reportAuditLogRouter);
app.use('/api', authMiddleware, reviewCommentsRouter);

// Authenticated routes — JWT or any service key (no specific scope)
app.use('/api', serviceAuthMiddleware, reportsRouter);
app.use('/api', serviceAuthMiddleware, navigationRouter);
app.use('/api', serviceAuthMiddleware, documentsRouter);
app.use('/api/na-reason-templates', serviceAuthMiddleware, naReasonTemplatesRouter);
app.use('/api', serviceAuthMiddleware, costEstimatesRouter);
app.use('/api', serviceAuthMiddleware, reportGenerationRouter);
app.use('/api', serviceAuthMiddleware, reportTemplatesRouter);

// Admin routes — JWT + admin only
app.use("/api/admin/service-keys", authMiddleware, requireAdmin, serviceKeysAdminRouter);

app.use('/api/reports', serviceAuthMiddleware, generatedReportsRouter);

// Error handling with detailed logging
app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  // Use pino-http request logger if available, fall back to shared logger
  const log = req.log || logger;
  log.error({
    method: req.method,
    path: req.path,
    statusCode: 500,
    err,
  }, 'Unhandled API error');

  // Check for common issues and provide hints
  const message = err.message.toLowerCase();
  if (message.includes('prisma') || message.includes('database') || message.includes('connect')) {
    log.error('Hint: Check DATABASE_URL is set correctly');
  }

  res.status(500).json({ error: 'Internal server error' });
});

// Start server with diagnostics
async function start(): Promise<void> {
  await logStartupDiagnostics();

  // Start background workers
  await startReportWorker();

  const server = app.listen(PORT, () => {
    logger.info({ port: PORT }, 'API server running');
  });

  // Graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, 'Shutting down gracefully');
    server.close(async () => {
      await stopReportWorker();
      process.exit(0);
    });
  };

  process.once('SIGTERM', () => shutdown('SIGTERM'));
  process.once('SIGINT', () => shutdown('SIGINT'));
}

start().catch(err => {
  logger.fatal({ err }, 'Failed to start server');
  process.exit(1);
});

export { app };

