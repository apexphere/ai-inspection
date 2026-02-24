/**
 * Redis connection config for BullMQ.
 */

import { Redis } from 'ioredis';

let _connection: Redis | null = null;

export function getRedisConnection(): Redis {
  if (!_connection) {
    const url = process.env.REDIS_URL || 'redis://localhost:6379';
    _connection = new Redis(url, {
      maxRetriesPerRequest: null, // Required by BullMQ
      enableReadyCheck: false,
    });

    _connection.on('error', (err: Error) => {
      console.error('[Redis] Connection error:', err.message);
    });

    _connection.on('connect', () => {
      console.log('[Redis] Connected');
    });
  }

  return _connection;
}

export async function closeRedisConnection(): Promise<void> {
  if (_connection) {
    await _connection.quit();
    _connection = null;
  }
}

/**
 * Verify Redis is reachable. Throws if connection fails.
 * Call during startup to fail fast on misconfiguration.
 */
export async function pingRedis(): Promise<void> {
  const conn = getRedisConnection();
  await conn.ping();
}
