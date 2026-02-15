import { Redis as UpstashRedis } from "@upstash/redis";

/**
 * Redis client used across the app.
 *
 * Production: uses Upstash Redis (REST) when `UPSTASH_REDIS_REST_URL` and
 * `UPSTASH_REDIS_REST_TOKEN` are set.
 *
 * Development fallback: in-memory store with real TTL behavior, so rate-limits
 * and OTP expiry behave correctly without needing Redis.
 */

type RedisLike = {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string, options?: { ex?: number }) => Promise<unknown>;
  del: (key: string) => Promise<number>;
  incr: (key: string) => Promise<number>;
  expire: (key: string, seconds: number) => Promise<number>;
  ttl: (key: string) => Promise<number>;
};

const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const hasUpstash = Boolean(upstashUrl && upstashToken);

// ---------------------------
// Dev-only in-memory fallback
// ---------------------------
declare global {
  var __redisMemoryStorage: Map<string, string> | undefined;
  var __redisMemoryExpiry: Map<string, number> | undefined; // epoch ms
}

const memStore = global.__redisMemoryStorage ?? new Map<string, string>();
const memExpiry = global.__redisMemoryExpiry ?? new Map<string, number>();
global.__redisMemoryStorage = memStore;
global.__redisMemoryExpiry = memExpiry;

const purgeIfExpired = (key: string) => {
  const exp = memExpiry.get(key);
  if (typeof exp === "number" && exp <= Date.now()) {
    memStore.delete(key);
    memExpiry.delete(key);
  }
};

const memoryRedis: RedisLike = {
  get: async (key) => {
    purgeIfExpired(key);
    return memStore.get(key) ?? null;
  },
  set: async (key, value, options) => {
    memStore.set(key, value);
    if (options?.ex && options.ex > 0) {
      memExpiry.set(key, Date.now() + options.ex * 1000);
    } else {
      memExpiry.delete(key);
    }
    return "OK";
  },
  del: async (key) => {
    purgeIfExpired(key);
    const existed = memStore.delete(key);
    memExpiry.delete(key);
    return existed ? 1 : 0;
  },
  incr: async (key) => {
    purgeIfExpired(key);
    const current = Number(memStore.get(key) ?? "0");
    const next = Number.isFinite(current) ? current + 1 : 1;
    memStore.set(key, String(next));
    return next;
  },
  expire: async (key, seconds) => {
    purgeIfExpired(key);
    if (!memStore.has(key)) return 0;
    memExpiry.set(key, Date.now() + Math.max(0, seconds) * 1000);
    return 1;
  },
  ttl: async (key) => {
    purgeIfExpired(key);
    if (!memStore.has(key)) return -2; // key does not exist
    const exp = memExpiry.get(key);
    if (!exp) return -1; // no ttl
    return Math.max(0, Math.ceil((exp - Date.now()) / 1000));
  },
};

// ---------------------------
// Upstash implementation
// ---------------------------
const upstashRedis: RedisLike | null = hasUpstash
  ? (() => {
      const client = new UpstashRedis({
        url: upstashUrl!,
        token: upstashToken!,
      });

      const wrapped: RedisLike = {
        get: async (key) => {
          const v = await client.get<string>(key);
          return v ?? null;
        },
        set: async (key, value, options) => {
          return await client.set(key, value, options?.ex ? { ex: options.ex } : undefined);
        },
        del: async (key) => await client.del(key),
        incr: async (key) => await client.incr(key),
        expire: async (key, seconds) => await client.expire(key, seconds),
        ttl: async (key) => await client.ttl(key),
      };

      return wrapped;
    })()
  : null;

const redis: RedisLike = upstashRedis ?? memoryRedis;

export default redis;

/**
 * Whether a real Redis backend is configured (required for OTP/rate-limits in production).
 * We intentionally do NOT throw at module import time because some CI/build environments
 * don't inject runtime secrets during `next build`.
 */
export const redisConfigured = Boolean(upstashRedis);
export const redisProvider: "upstash" | "memory" = upstashRedis ? "upstash" : "memory";