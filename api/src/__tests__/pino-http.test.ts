/**
 * pino-http Request Logging Tests — Issue #573
 */

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { pinoHttp } from 'pino-http';
import pino from 'pino';

function createTestApp() {
  const logs: Record<string, unknown>[] = [];
  const stream = {
    write(msg: string) {
      logs.push(JSON.parse(msg));
    },
  };

  const logger = pino({ level: 'info' }, stream);
  const app = express();

  app.use(pinoHttp({
    logger,
    autoLogging: {
      ignore: (req: any) => req.url === '/health' || req.url === '/health/ready',
    },
    customSuccessMessage: (req: any, res: any) => `${req.method} ${req.url} ${res.statusCode}`,
    customErrorMessage: (req: any, res: any) => `${req.method} ${req.url} ${res.statusCode}`,
  }));

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.get('/api/test', (_req, res) => res.json({ ok: true }));
  app.post('/api/data', (_req, res) => res.status(201).json({ created: true }));
  app.get('/api/error', (_req, _res, next) => next(new Error('test error')));

  // Error handler using req.log
  app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const log = req.log || logger;
    log.error({ err, statusCode: 500 }, 'Unhandled API error');
    res.status(500).json({ error: 'Internal server error' });
  });

  return { app, logs };
}

describe('pino-http Request Logging — #573', () => {
  it('logs request with method, url, statusCode, responseTime', async () => {
    const { app, logs } = createTestApp();
    await request(app).get('/api/test');

    const reqLog = logs.find((l) => l.msg && (l.msg as string).includes('GET /api/test'));
    expect(reqLog).toBeDefined();
    expect(reqLog!.req).toBeDefined();
    expect(reqLog!.res).toBeDefined();
    expect(reqLog!.responseTime).toBeDefined();
    expect(typeof reqLog!.responseTime).toBe('number');
  });

  it('includes unique request ID (req.id)', async () => {
    const { app, logs } = createTestApp();
    await request(app).get('/api/test');

    const reqLog = logs.find((l) => l.msg && (l.msg as string).includes('GET /api/test'));
    expect(reqLog).toBeDefined();
    expect((reqLog!.req as Record<string, unknown>).id).toBeDefined();
  });

  it('does NOT log health check requests', async () => {
    const { app, logs } = createTestApp();
    await request(app).get('/health');

    const healthLog = logs.find((l) => l.msg && (l.msg as string).includes('/health'));
    expect(healthLog).toBeUndefined();
  });

  it('logs errors via pino on unhandled errors', async () => {
    const { app, logs } = createTestApp();
    await request(app).get('/api/error');

    const errorLog = logs.find((l) => l.msg === 'Unhandled API error');
    expect(errorLog).toBeDefined();
    expect(errorLog!.level).toBe(50); // pino error level
    expect((errorLog!.err as Record<string, unknown>).message).toBe('test error');
  });

  it('logs POST requests with correct method', async () => {
    const { app, logs } = createTestApp();
    await request(app).post('/api/data').send({ foo: 'bar' });

    const reqLog = logs.find((l) => l.msg && (l.msg as string).includes('POST /api/data'));
    expect(reqLog).toBeDefined();
  });
});
