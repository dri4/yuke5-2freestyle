import Redis from 'ioredis';

let client: Redis | null = null;

export function createRedisClientIfNeeded(): Redis | null {
  if (client) return client;
  const url = process.env.REDIS_URL || process.env.REDIS;
  if (!url) return null;
  try {
    client = new Redis(url);
    client.on('error', (err) => console.warn('Redis error (visit):', err));
    return client;
  } catch (e) {
    console.warn('Failed to create redis client (visit):', e);
    return null;
  }
}
