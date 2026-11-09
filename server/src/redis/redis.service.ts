import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { redisConnectionFromUrl } from '../common/utils/redis-config';

/**
 * Small resilient Redis wrapper. The marketplace must stay usable when Redis is
 * briefly unavailable, so every helper degrades gracefully instead of throwing.
 */
@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis;

  constructor(config: ConfigService) {
    const options = redisConnectionFromUrl(config.get<string>('REDIS_URL'));
    this.client = new Redis({
      ...options,
      lazyConnect: true,
      maxRetriesPerRequest: 2,
    });
    this.client.on('error', (error) => this.logger.warn(`Redis: ${error.message}`));
    this.client.connect().catch(() => this.logger.warn('Redis is not reachable — caching/queues degraded.'));
  }

  get raw() {
    return this.client;
  }

  async ping(): Promise<boolean> {
    try {
      return (await this.client.ping()) === 'PONG';
    } catch {
      return false;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);
      return value ? (JSON.parse(value) as T) : null;
    } catch {
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    try {
      const payload = JSON.stringify(value);
      if (ttlSeconds) await this.client.set(key, payload, 'EX', ttlSeconds);
      else await this.client.set(key, payload);
    } catch {
      /* non-fatal */
    }
  }

  async del(...keys: string[]): Promise<void> {
    if (!keys.length) return;
    try {
      await this.client.del(...keys);
    } catch {
      /* non-fatal */
    }
  }

  /** Atomic counter used by the API rate limiter and OTP throttling. */
  async increment(key: string, ttlSeconds: number): Promise<number> {
    try {
      const value = await this.client.incr(key);
      if (value === 1) await this.client.expire(key, ttlSeconds);
      return value;
    } catch {
      return 0;
    }
  }

  async remember<T>(key: string, ttlSeconds: number, loader: () => Promise<T>): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;
    const fresh = await loader();
    await this.set(key, fresh, ttlSeconds);
    return fresh;
  }

  async onModuleDestroy() {
    try {
      await this.client.quit();
    } catch {
      this.client.disconnect();
    }
  }
}
