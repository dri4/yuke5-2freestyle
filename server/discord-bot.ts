// Recreated clean discord-bot module without geo lookup
import { Client, GatewayIntentBits, ButtonBuilder, ActionRowBuilder, ButtonStyle, MessageActionRowComponentBuilder } from 'discord.js';
import { Redis } from 'ioredis';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';

dotenv.config();

// Path to the JSON file storing blocked IPs
const BLOCKED_IPS_FILE = path.join(process.cwd(), 'data', 'blocked-ips.json');

const DISCORD_TOKEN = process.env.DISCORD_BOT_TOKEN;

if (!DISCORD_TOKEN) {
  console.error('Missing DISCORD_BOT_TOKEN. Please set it in .env');
  process.exit(1);
}

// Initialize Redis client (optional)
let redisClient: Redis | null = null;
const redisUrl = process.env.REDIS_URL;
if (redisUrl) {
  try {
    redisClient = new Redis(redisUrl);
    console.log('Redis connected successfully');
  } catch (err) {
    console.warn('Failed to connect to Redis, IP blocking will be disabled:', err);
  }
}

// Initialize Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Create a promise that resolves when the bot is ready
const botReadyPromise = new Promise<void>((resolve) => {
  client.once('ready', () => {
    console.log('[DISCORD] Bot logged in as:', client.user?.tag);
    resolve();
  });
});

// Track blocked IPs
const BLOCKED_IPS_KEY = 'contact:blocked_ips';

// In-memory cache for blocked IPs
const blockedIPs = new Set<string>();

async function saveBlockedIPs() {
  try {
    const ips = Array.from(blockedIPs);
    if (redisClient) {
      await redisClient.del(BLOCKED_IPS_KEY);
      if (ips.length > 0) {
        await redisClient.sadd(BLOCKED_IPS_KEY, ...ips);
      }
    }

    await fs.mkdir(path.dirname(BLOCKED_IPS_FILE), { recursive: true });
    await fs.writeFile(BLOCKED_IPS_FILE, JSON.stringify({ blockedIPs: ips }, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving blocked IPs:', err);
  }
}

// Sync IPs between Redis and JSON file
async function syncBlockedIPs() {
  try {
    await fs.mkdir(path.dirname(BLOCKED_IPS_FILE), { recursive: true });

    let redisIPs: string[] = [];
    let fileIPs: string[] = [];

    if (redisClient) {
      redisIPs = await redisClient.smembers(BLOCKED_IPS_KEY);
    }

    try {
      const data = await fs.readFile(BLOCKED_IPS_FILE, 'utf-8');
      const { blockedIPs: savedIPs } = JSON.parse(data);
      fileIPs = savedIPs || [];
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.error('Error reading blocked IPs file:', err);
      }
    }

    const allIPs = new Set([...redisIPs, ...fileIPs]);
    blockedIPs.clear();
    allIPs.forEach(ip => blockedIPs.add(ip));

    if (redisClient && allIPs.size > 0) {
      await redisClient.sadd(BLOCKED_IPS_KEY, ...Array.from(allIPs));
    }

    await saveBlockedIPs();
    console.log(`Synced ${allIPs.size} blocked IPs across storage systems`);
  } catch (err) {
    console.error('Error syncing blocked IPs:', err);
  }
}

// Sync IPs on startup
syncBlockedIPs();

export async function isIPBlocked(ip: string): Promise<boolean> {
  if (blockedIPs.has(ip)) return true;
  if (redisClient) {
    try {
      const blocked = (await redisClient.sismember(BLOCKED_IPS_KEY, ip)) === 1;
      if (blocked) {
        blockedIPs.add(ip);
        await saveBlockedIPs();
      }
      return blocked;
    } catch (err) {
      console.error('Error checking blocked IP status in Redis:', err);
      return blockedIPs.has(ip);
    }
  }
  return blockedIPs.has(ip);
}

export async function blockIP(ip: string): Promise<{ success: boolean; message: string }> {
  try {
    const already = await isIPBlocked(ip);
    if (already) return { success: false, message: 'IP is already blocked' };
    blockedIPs.add(ip);
    await Promise.all([
      redisClient?.sadd(BLOCKED_IPS_KEY, ip).catch(err => console.error('Error adding IP to Redis:', err)),
      saveBlockedIPs()
    ]);
    return { success: true, message: `IP ${ip} has been blocked` };
  } catch (err) {
    console.error('Error blocking IP:', err);
    return { success: false, message: 'Failed to block IP' };
  }
}

export async function unblockIP(ip: string): Promise<{ success: boolean; message: string }> {
  try {
    let wasBlocked = false;
    if (blockedIPs.has(ip)) { blockedIPs.delete(ip); wasBlocked = true; }
    if (wasBlocked) {
      await Promise.all([
        redisClient?.srem(BLOCKED_IPS_KEY, ip).catch(err => console.error('Error removing IP from Redis:', err)),
        saveBlockedIPs()
      ]);
      return { success: true, message: `IP ${ip} has been unblocked` };
    }
    return { success: false, message: 'IP was not blocked' };
  } catch (err) {
    console.error('Error unblocking IP:', err);
    return { success: false, message: 'Failed to unblock IP' };
  }
}

export async function sendContactNotification(payload: {
  ip: string;
  email: string;
  firstName?: string;
  lastName?: string;
  interest?: string;
  description?: string;
  visit?: any;
}) {
  try {
    // Wait for the bot to be ready before attempting to send
    await botReadyPromise;

    const channelId = process.env.DISCORD_CHANNEL_ID;
    console.log('[DEBUG] channelId from env:', channelId);
    console.log('[DEBUG] client.readyAt:', client.readyAt);
    console.log('[DEBUG] client.isReady():', client.isReady?.());
    if (!channelId) throw new Error('DISCORD_CHANNEL_ID not set in environment');
    const channel = await client.channels.fetch(channelId);
    console.log('[DEBUG] Fetched channel:', { id: channel?.id, type: channel?.type, isDMBased: channel?.isDMBased?.(), isTextBased: channel?.isTextBased?.(), isVoiceBased: channel?.isVoiceBased?.(), constructor: channel?.constructor?.name });
    if (!channel?.isTextBased()) throw new Error(`Invalid channel or not a text channel (type: ${channel?.type}, isTextBased: ${channel?.isTextBased?.()})`);
    const textChannel = channel as import('discord.js').TextChannel;

    const blockButton = new ButtonBuilder().setCustomId(`block_${payload.ip}`).setLabel('Block IP').setStyle(ButtonStyle.Danger);
    const unblockButton = new ButtonBuilder().setCustomId(`unblock_${payload.ip}`).setLabel('Unblock IP').setStyle(ButtonStyle.Success);
    const row = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(blockButton, unblockButton);

    const parts: string[] = [
      '📬 New contact submission:',
      `👤 Name: **${payload.firstName || ''} ${payload.lastName || ''}**`,
      `📧 Email: ${payload.email}`,
      `🌐 IP: ${payload.ip}`
    ];
    if (payload.interest) parts.push(`🎯 Interest: ${payload.interest}`);
    if (payload.description) parts.push(`📝 Message: ${payload.description}`);

    if (payload.visit) {
      const v = payload.visit;
      parts.push('\n--- Visit info ---\n');
      parts.push(`📍 Path: **${v.path || 'unknown'}**`);
      parts.push(`🕒 When: **${new Date(v.ts).toLocaleString()}**`);
      parts.push(`🔎 User-Agent: ${v.headers?.userAgent || 'unknown'}`);
      parts.push(`↩️ Referrer: ${v.headers?.referer || 'direct'}`);
      parts.push('\n--- Location ---');
      parts.push('❗ Location lookup disabled');
    }

    const message = parts.join('\n');
    await textChannel.send({ content: message, components: [row] });
  } catch (err) {
    console.error('Error sending Discord notification:', err);
    throw err;
  }
}

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;
  const [action, ip] = interaction.customId.split('_');
  try {
    await interaction.deferReply({ ephemeral: true });
    let result;
    if (action === 'block') result = await blockIP(ip);
    else if (action === 'unblock') result = await unblockIP(ip);
    else { await interaction.editReply({ content: 'Invalid action' }); return; }
    await interaction.editReply({ content: result.message });
  } catch (err) {
    console.error('Error handling button interaction:', err);
    try {
      if (!interaction.deferred && !interaction.replied) {
        await interaction.reply({ content: 'An error occurred while processing your request', ephemeral: true });
      } else {
        await interaction.editReply({ content: 'An error occurred while processing your request' });
      }
    } catch (replyErr) { console.error('Failed to send error response:', replyErr); }
  }
});

client.on('error', (error) => { console.error('Discord client error:', error); });
process.on('unhandledRejection', (error) => { console.error('Unhandled promise rejection:', error); });
client.login(DISCORD_TOKEN);
export default client;