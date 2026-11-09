import type { RedisOptions } from 'ioredis';

/**
 * Parse a `redis://user:pass@host:port/db` URL into ioredis options.
 * BullMQ accepts these options directly and this keeps TLS flags explicit.
 */
export function redisConnectionFromUrl(url = 'redis://localhost:6379'): RedisOptions {
  try {
    const parsed = new URL(url);
    const isTls = parsed.protocol === 'rediss:';
    const db = parsed.pathname.replace('/', '');
    return {
      host: parsed.hostname || 'localhost',
      port: Number(parsed.port || (isTls ? 6379 : 6379)),
      ...(parsed.username ? { username: decodeURIComponent(parsed.username) } : {}),
      ...(parsed.password ? { password: decodeURIComponent(parsed.password) } : {}),
      ...(db ? { db: Number(db) } : {}),
      ...(isTls ? { tls: {} } : {}),
      // Required by BullMQ workers so a blocking connection can reconnect.
      maxRetriesPerRequest: null,
      enableOfflineQueue: false,
      retryStrategy: (times: number) => Math.min(times * 500, 5_000),
    };
  } catch {
    return { host: 'localhost', port: 6379, maxRetriesPerRequest: null };
  }
}
