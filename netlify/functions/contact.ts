// Only Discord webhook is used in this function (email sending removed)

import Redis from 'ioredis';

const disposable = new Set([
  "mailinator.com",
  "10minutemail.com",
  "temp-mail.org",
  "yopmail.com",
  "guerrillamail.com",
]);

const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 6; // max submissions per IP per window

const redisUrl = process.env.REDIS_URL || process.env.REDIS;
let redisClient: Redis | null = null;
if (redisUrl) {
  try {
    redisClient = new Redis(redisUrl);
    redisClient.on('error', (e) => console.warn('Redis error', e));
  } catch (e) {
    console.warn('Failed to init Redis client for Netlify function', e);
    redisClient = null;
  }
}

// In-memory fallback
const ipTimestamps = new Map<string, number[]>();

const validate = (body: any) => {
  if (!body?.email) return "Missing email";
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRe.test(body.email)) return "Invalid email";
  const domain = body.email.split("@")[1]?.toLowerCase();
  if (disposable.has(domain)) return "Disposable email not allowed";
  return null;
};

export const handler = async (event: any) => {
  try {
    if (event.httpMethod !== "POST") return { statusCode: 405 };
  const body = JSON.parse(event.body || "{}");
  console.log("contact function invoked with:", { email: body.email });

  // Rate limiting by IP (try Redis first)
  const ip = (event.headers && (event.headers['x-forwarded-for'] || event.headers['X-Forwarded-For'])) || (event.requestContext && event.requestContext.identity && event.requestContext.identity.sourceIp) || 'unknown';
  const now = Date.now();
  if (redisClient) {
    const key = `contact:ip:${ip}`;
    const count = await redisClient.incr(key);
    if (count === 1) await redisClient.pexpire(key, RATE_LIMIT_WINDOW_MS);
    if (count > RATE_LIMIT_MAX) {
      await redisClient.rpush('contact:analytics', JSON.stringify({ ts: now, ip, email: body.email || null, success: false, reason: 'rate_limited' }));
      return { statusCode: 429, body: 'Too many submissions, please try again later.' };
    }
  } else {
    const timestamps = ipTimestamps.get(ip) || [];
    const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
    if (recent.length >= RATE_LIMIT_MAX) {
      return { statusCode: 429, body: 'Too many submissions, please try again later.' };
    }
    recent.push(now);
    ipTimestamps.set(ip, recent);
  }

    const err = validate(body);
    if (err) return { statusCode: 400, body: err };

    // Post to Discord webhook if configured
    const webhook = process.env.DISCORD_WEBHOOK_URL;
    let sentToDiscord = false;
    if (webhook) {
      try {
        await fetch(webhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: `New contact from ${body.email}: ${body.description || "(no description)"}` }),
        });
        sentToDiscord = true;
      } catch (e) {
        console.warn("Discord send failed", e);
      }
    }

    // push analytics
    try {
      if (redisClient) {
        await redisClient.rpush('contact:analytics', JSON.stringify({ ts: Date.now(), ip, email: body.email || null, success: true, sentToDiscord }));
      }
    } catch (e) {
      console.warn('Failed to push analytics to Redis', e);
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: "Server error" };
  }
};

export default handler;
