import express from "express";
import Redis from "ioredis";

const router = express.Router();

// If REDIS_URL is provided, use Redis for analytics
const redisUrl = process.env.REDIS_URL || process.env.REDIS;
let redisClient: Redis | null = null;
if (redisUrl) {
  try {
    redisClient = new Redis(redisUrl);
    redisClient.on("error", (err) => console.warn("Redis error:", err));
  } catch (e) {
    console.warn("Failed to create Redis client", e);
    redisClient = null;
  }
}

router.post("/visit", async (_req, res) => {
  // Legacy visit endpoint disabled. Tracking is performed server-side in middleware
  // and visit data is attached to contact submissions only. This endpoint intentionally
  // returns 404 to avoid exposing a discoverable analytics endpoint.
  return res.status(404).json({ ok: false, message: 'Disabled' });
});

export default router;