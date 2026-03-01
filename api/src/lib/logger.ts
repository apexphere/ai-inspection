/**
 * Structured Logger — Issue #572
 *
 * Shared pino logger instance for the API service.
 * Outputs newline-delimited JSON for Grafana Loki ingestion.
 * Uses pino-pretty in development for human-readable output.
 */

import pino from 'pino';

const isDev = process.env.NODE_ENV !== 'production';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',

  // Structured fields added to every log line
  base: {
    service: 'api',
    env: process.env.NODE_ENV || 'development',
  },

  // Redact sensitive fields
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'password',
      'token',
      'secret',
      'apiKey',
    ],
    censor: '[REDACTED]',
  },

  // Human-readable in dev
  ...(isDev && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss',
        ignore: 'pid,hostname,service,env',
      },
    },
  }),
});

export type Logger = pino.Logger;
