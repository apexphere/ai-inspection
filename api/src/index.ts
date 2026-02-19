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
import { navigationRouter } from './routes/navigation.js';
import { projectsRouter } from './routes/projects.js';
import { propertiesRouter } from './routes/properties.js';
import { clientsRouter } from './routes/clients.js';
import { siteInspectionsRouter } from './routes/site-inspections.js';
import { checklistItemsRouter } from './routes/checklist-items.js';
import { buildingCodeRouter } from './routes/building-code.js';
import { clauseReviewsRouter } from './routes/clause-reviews.js';
import { documentsRouter } from './routes/documents.js';
import { authMiddleware } from './middleware/auth.js';
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
app.use('/api/auth', authRouter);

// Protected routes (auth required)
app.use('/api/inspections', authMiddleware, inspectionsRouter);
app.use('/api', authMiddleware, findingsRouter);
app.use('/api', authMiddleware, photosRouter);
app.use('/api', authMiddleware, reportsRouter);
app.use('/api', authMiddleware, navigationRouter);
app.use('/api/projects', authMiddleware, projectsRouter);
app.use('/api/properties', authMiddleware, propertiesRouter);
app.use('/api/clients', authMiddleware, clientsRouter);
app.use('/api', authMiddleware, siteInspectionsRouter);
app.use('/api', authMiddleware, checklistItemsRouter);
app.use('/api/building-code', authMiddleware, buildingCodeRouter);
app.use('/api', authMiddleware, clauseReviewsRouter);
app.use('/api', authMiddleware, documentsRouter);

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
  
  app.listen(PORT, () => {
    console.log(`API server running on port ${PORT}`);
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export { app };
