/**
 * Structured Logger — Issue #574
 *
 * Shared pino logger instance for the MCP server.
 * Outputs newline-delimited JSON for Grafana Loki ingestion.
 *
 * Note: MCP server communicates via stdio, so logs MUST go to stderr
 * (stdout is reserved for MCP JSON-RPC protocol messages).
 */

import pino from 'pino';

const isDev = process.env.NODE_ENV !== 'production';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',

  base: {
    service: 'mcp-server',
    env: process.env.NODE_ENV || 'development',
  },

  redact: {
    paths: [
      'password',
      'token',
      'secret',
      'apiKey',
    ],
    censor: '[REDACTED]',
  },

  // Human-readable in dev, always to stderr
  ...(isDev
    ? {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss',
            ignore: 'pid,hostname,service,env',
            destination: 2, // stderr
          },
        },
      }
    : {
        // Production: JSON to stderr
        transport: {
          target: 'pino/file',
          options: { destination: 2 },
        },
      }),
});

export type Logger = pino.Logger;
