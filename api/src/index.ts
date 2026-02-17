import express from 'express';
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
import { authMiddleware } from './middleware/auth.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
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

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});

export { app };
