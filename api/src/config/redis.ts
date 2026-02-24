/**
 * Redis connection config for BullMQ.
 * Redis is OPTIONAL — when REDIS_URL is not set, all exports
 * return null / no-op so the API starts without a queue backend.
 */

import { Redis } from 'ioredis';

let _connection: Redis | null = null;

/**
 * Returns true when a REDIS_URL env var is configured.
 */
export function isRedisConfigured(): boolean {
  return !!process.env.REDIS_URL;
}

/**
 * Get the shared Redis connection.
 * Returns null when REDIS_URL is not set.
 */
export function getRedisConnection(): Redis | null {
  if (!isRedisConfigured()) {
    return null;
  }

  if (!_connection) {
    const url = process.env.REDIS_URL!;
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
 * Verify Redis is reachable. Returns false when not configured.
 */
export async function pingRedis(): Promise<boolean> {
  const conn = getRedisConnection();
  if (!conn) return false;
  await conn.ping();
  return true;
}
