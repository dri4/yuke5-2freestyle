import fs from 'fs';
import Redis from 'ioredis';

export async function getLatestVisitForIP(ip: string): Promise<any | null> {
  // Try Redis first
  const redisUrl = process.env.REDIS_URL || process.env.REDIS;
  if (redisUrl) {
    try {
      const client = new Redis(redisUrl);
      // Get last 100 entries and search from the end for a matching IP
      const list = await client.lrange('visits:analytics', -100, -1);
      for (let i = list.length - 1; i >= 0; i--) {
        try {
          const parsed = JSON.parse(list[i]);
          if (parsed.ip === ip) return parsed;
        } catch (e) {
          continue;
        }
      }
      client.disconnect();
    } catch (e) {
      // ignore redis errors
    }
  }

  // Fallback to server/data/visits.log if present (kept out of web root)
  try {
    const path = require('path');
    const logPath = path.join(process.cwd(), 'server', 'data', 'visits.log');
    if (fs.existsSync(logPath)) {
      const data = fs.readFileSync(logPath, 'utf-8');
      const lines = data.trim().split(/\r?\n/);
      for (let i = lines.length - 1; i >= 0; i--) {
        try {
          const parsed = JSON.parse(lines[i]);
          if (parsed.ip === ip) return parsed;
        } catch (e) {
          continue;
        }
      }
    }
  } catch (e) {
    // ignore
  }

  return null;
}
