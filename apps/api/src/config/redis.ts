import Redis from 'ioredis';
import { env } from './env';
import { logger } from './logger';

// Redis para uso geral (cache, sessions, etc)
export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

// Redis para BullMQ (requer maxRetriesPerRequest: null)
export const bullmqConnection = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  lazyConnect: true,
});

redis.on('connect', () => {
  logger.info('✅ Redis connected');
});

redis.on('error', error => {
  logger.error({ error }, '❌ Redis error');
});

redis.on('close', () => {
  logger.warn('Redis connection closed');
});

export async function connectRedis(): Promise<void> {
  try {
    await redis.connect();
  } catch (error) {
    logger.error({ error }, '❌ Redis connection failed');
    throw error;
  }
}

export async function disconnectRedis(): Promise<void> {
  await redis.quit();
  logger.info('Redis disconnected');
}
