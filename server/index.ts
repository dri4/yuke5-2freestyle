import express from "express";
import cors from "cors";
import { config } from "dotenv";
import contactRouter from "./routes/contact";

// Load environment variables
config();

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Block direct access to files that would reveal implementation details or logs.
  // This prevents requests like /visits.log or *.map from being discoverable.
  app.use((req, res, next) => {
    try {
      const p = (req.path || '').toLowerCase();
      // Block source maps explicitly
      if (p.endsWith('.map')) return res.sendStatus(404);

      // Block a small list of sensitive filenames
      const sensitive = ['visits.log', 'blocked-ips.json', 'package.json', '.env', 'package-lock.json', 'yarn.lock'];
      for (const name of sensitive) {
        if (p.includes(name)) return res.sendStatus(404);
      }
    } catch (e) {
      // continue on error
    }
    next();
  });

  // Simple in-memory rate limiter to reduce impact of rapid requests from one IP.
  // Conservative defaults; can be tuned with env vars.
  const RATE_LIMIT_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW_SECONDS || '60', 10); // seconds
  const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '120', 10);
  const ipCounters = new Map<string, { count: number; windowStart: number }>();

  app.use((req, res, next) => {
    try {
      const now = Math.floor(Date.now() / 1000);
      const ip = (req.ip || (req.headers['x-forwarded-for'] as string) || 'unknown').toString();
      const entry = ipCounters.get(ip);
      if (!entry || now - entry.windowStart >= RATE_LIMIT_WINDOW) {
        ipCounters.set(ip, { count: 1, windowStart: now });
      } else {
        entry.count += 1;
        // If over limit, respond with 429. Keep message generic to avoid revealing defenses.
        if (entry.count > RATE_LIMIT_MAX) {
          res.setHeader('Retry-After', String(RATE_LIMIT_WINDOW));
          return res.status(429).send('Too many requests');
        }
      }
      // Periodically clean up old entries to avoid memory growth (best-effort)
      if (Math.random() < 0.002) { // run occasionally
        const cutoff = now - RATE_LIMIT_WINDOW * 5;
        for (const [k, v] of ipCounters.entries()) {
          if (v.windowStart < cutoff) ipCounters.delete(k);
        }
      }
    } catch (e) {
      // If rate limiter fails, don't block requests
    }
    next();
  });

  // Visit tracking middleware: capture basic visitor info for every page request
  app.use(async (req, res, next) => {
    try {
      // Only capture page views (HTML requests) and API routes can opt out
      const accept = req.headers['accept'] || '';
  if (accept.includes('text/html') || req.path === '/' || req.path === '/index.html') {
        const ip = (req.ip || req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown') as string;
        const visitor = {
          ts: Date.now(),
          ip,
          path: req.originalUrl || req.url,
          method: req.method,
          headers: {
            userAgent: req.headers['user-agent'],
            acceptLanguage: req.headers['accept-language'],
            referer: req.headers['referer'] || null,
          }
        };

        // Dev-only logging so we can verify middleware triggers
        if (process.env.NODE_ENV !== 'production') {
          try {
            // append to server/data/visits.log (kept out of web root and repo)
            const fs = await import('fs');
            const path = await import('path');
            const logDir = path.join(process.cwd(), 'server', 'data');
            const logPath = path.join(logDir, 'visits.log');
            try {
              fs.mkdirSync(logDir, { recursive: true });
            } catch (e) {
              // ignore mkdir errors
            }
            // Use appendFileSync so writes are immediate; file is inside server/ so not exposed by SPA static
            fs.appendFileSync(logPath, JSON.stringify(visitor) + '\n');
          } catch (e) { /* ignore */ }
        }

        // Optionally push to Redis if configured (visitRouter handled this before)
        try {
          // Lazy require to avoid adding Redis dependency here if not used
          const { createRedisClientIfNeeded } = await import('./utils/redis-visit');
          const rc = createRedisClientIfNeeded();
          if (rc) {
            rc.rpush('visits:analytics', JSON.stringify(visitor)).catch(() => {});
          }
        } catch (e) {
          // ignore redis errors here
        }

        // NOTE: we intentionally DO NOT forward every visit to Discord anymore.
        // Visit data is stored (Redis or dev log) and will be attached to contact
        // submissions. This avoids noisy webhooks for passive visitors.
      }
    } catch (err) {
      // don't break requests for analytics errors
    }
    next();
  });

  // Production security headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
  });

  // Production routes
  app.use('/api', contactRouter);

  return app;
}
