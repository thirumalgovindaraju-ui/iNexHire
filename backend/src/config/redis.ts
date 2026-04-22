// src/config/redis.ts
import IORedis from 'ioredis';
import { env } from './env';

export const redis = new IORedis(env.redisUrl, {
  maxRetriesPerRequest: null, // required by BullMQ
});

redis.on('error', (err) => console.error('[Redis] Error:', err));
redis.on('connect', () => console.log('[Redis] Connected'));
