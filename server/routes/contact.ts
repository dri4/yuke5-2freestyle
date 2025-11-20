import express from "express";
import { z } from "zod";
// Avoid importing the discord-bot at module load time because the bot
// module attempts to login on import (and will exit if env is missing).
// We import it lazily inside the request handler so local runs can opt-out
// by setting DISABLE_DISCORD=true (useful for local testing without bot creds).
import { getLatestVisitForIP } from "../utils/get-latest-visit";

const router = express.Router();

const ContactSchema = z.object({
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  email: z.string().email(),
  interest: z.string().max(200).optional(),
  budget: z.string().max(100).optional(),
  description: z.string().max(2000).optional(),
});

// Rate limiting defaults
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 6; // max 6 submissions per IP per window

// In-memory fallback (per process)
const ipTimestamps = new Map<string, number[]>();

const disposableDomains = new Set([
  "mailinator.com",
  "10minutemail.com",
  "temp-mail.org",
  "yopmail.com",
  "guerrillamail.com",
  "maildrop.cc",
  "trashmail.com",
  "tempmail.com",
  "dispostable.com",
]);

const isDisposable = (email: string) => {
  const parts = email.split("@");
  if (parts.length < 2) return false;
  return disposableDomains.has(parts[1].toLowerCase());
};

router.post("/contact", async (req, res) => {
    try {
      const ip = (req.ip || req.headers["x-forwarded-for"] || "unknown") as string;

      // Lazily import discord helpers so we don't force a bot login during
      // local static serving. If DISABLE_DISCORD is set, use a noop stub.
      let sendContactNotification: ((payload: any) => Promise<void>) | null = null;
      let isIPBlocked: ((ip: string) => Promise<boolean>) | null = null;
      if (process.env.DISABLE_DISCORD === 'true') {
        // Local testing: skip discord integration
        isIPBlocked = async () => false;
        sendContactNotification = async () => { /* no-op */ };
      } else {
        try {
          const bot = await import("../discord-bot");
          sendContactNotification = bot.sendContactNotification;
          isIPBlocked = bot.isIPBlocked;
        } catch (err) {
          console.warn('Failed to initialize discord-bot, continuing without notifications', err);
          isIPBlocked = async () => false;
          sendContactNotification = async () => { /* no-op */ };
        }
      }

      // Check if IP is blocked
      if (await isIPBlocked(ip)) {
        return res.status(403).send("You may not send messages at this time.");
      }

      // Rate limiting (in-memory)
      const now = Date.now();
      const timestamps = ipTimestamps.get(ip) || [];
      const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
      if (recent.length >= RATE_LIMIT_MAX) {
        return res.status(429).send("Too many submissions, please try again later.");
      }
      recent.push(now);
      ipTimestamps.set(ip, recent);    const parsed = ContactSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.format() });
    }

    const payload = parsed.data;

    if (isDisposable(payload.email)) {
      return res.status(400).send("Disposable email addresses are not allowed.");
    }

    // Send to Discord bot
    let sentToDiscord = false;
    try {
      const latestVisit = await getLatestVisitForIP(ip);
      await sendContactNotification({
        ip,
        email: payload.email,
        firstName: payload.firstName,
        lastName: payload.lastName,
        interest: payload.interest,
        description: payload.description,
        visit: latestVisit || undefined,
      });
      sentToDiscord = true;
    } catch (err) {
      console.warn("Discord notification failed:", err);
    }

    // Only send Discord webhook; email sending removed per request

    // Return success
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("/api/contact error", err);
    return res.status(500).send("Server error");
  }
});

export default router;
