import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { healthRouter } from './routes/health.js';
import { inspectionsRouter } from './routes/inspections.js';
import { findingsRouter } from './routes/findings.js';
import { photosRouter } from './routes/photos.js';
import { reportsRouter } from './routes/reports.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increased limit for base64 photos

// Routes
app.use('/health', healthRouter);
app.use('/api/inspections', inspectionsRouter);
app.use('/api', findingsRouter);
app.use('/api', photosRouter);
app.use('/api', reportsRouter);

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
