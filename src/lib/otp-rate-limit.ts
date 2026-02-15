import redis from "./redis";
import { timingSafeEqual } from "node:crypto";

export interface OTPRateLimitInfo {
  attempts: number
  isBlocked: boolean
  blockExpiresIn?: number // seconds
  nextAttemptIn?: number // seconds
}

export class OTPRateLimit {
  private static readonly MAX_ATTEMPTS = 5
  private static readonly BLOCK_TIME_15_MIN = 30 * 60 // 30 minutes
  private static readonly BLOCK_TIME_SPAM = 24 * 60 * 60 // 24 hours
  private static readonly REQUEST_COOLDOWN = 30 // 30 seconds
  private static normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  static async getRateLimitInfo(email: string): Promise<OTPRateLimitInfo> {
    const e = this.normalizeEmail(email);
    const attemptsKey = `otp:attempts:${e}`
    const blockKey = `otp:block:${e}`
    const requestCooldownKey = `otp:request_cooldown:${e}`

    const [attempts, blockTTL, cooldownTTL] = await Promise.all([
      redis.get(attemptsKey).then(Number),
      redis.ttl(blockKey),
      redis.ttl(requestCooldownKey),
    ])

    const isBlocked = blockTTL > 0
    const isOnCooldown = cooldownTTL > 0

    return {
      attempts: attempts || 0,
      isBlocked,
      blockExpiresIn: isBlocked ? blockTTL : undefined,
      nextAttemptIn: isOnCooldown ? cooldownTTL : undefined,
    }
  }

  static async recordFailedAttempt(email: string): Promise<OTPRateLimitInfo> {
    const e = this.normalizeEmail(email);
    const attemptsKey = `otp:attempts:${e}`
    const blockKey = `otp:block:${e}`

    const attempts = await redis.incr(attemptsKey)
    
    // Set TTL for attempts counter (15 minutes)
    if (attempts === 1) {
      await redis.expire(attemptsKey, 15 * 60)
    }

    // Check if we need to block the account
    if (attempts >= this.MAX_ATTEMPTS) {
      // Check if this is spam activity (many attempts in short time)
      const recentAttempts = await redis.get(attemptsKey).then(Number)
      const blockTime = recentAttempts > 10 ? this.BLOCK_TIME_SPAM : this.BLOCK_TIME_15_MIN
      
      await redis.set(blockKey, '1', { ex: blockTime })
      
      return {
        attempts,
        isBlocked: true,
        blockExpiresIn: blockTime,
      }
    }

    return {
      attempts,
      isBlocked: false,
    }
  }

  static async resetAttempts(email: string): Promise<void> {
    const e = this.normalizeEmail(email);
    const attemptsKey = `otp:attempts:${e}`
    const blockKey = `otp:block:${e}`
    
    await Promise.all([
      redis.del(attemptsKey),
      redis.del(blockKey),
    ])
  }

  static async isRequestAllowed(email: string): Promise<{ allowed: boolean; nextAttemptIn?: number }> {
    const e = this.normalizeEmail(email);
    const cooldownKey = `otp:request_cooldown:${e}`
    const ttl = await redis.ttl(cooldownKey)
    
    if (ttl > 0) {
      return { allowed: false, nextAttemptIn: ttl }
    }
    
    // Set cooldown for next request
    await redis.set(cooldownKey, '1', { ex: this.REQUEST_COOLDOWN })
    
    return { allowed: true }
  }

  static async storeOTP(email: string, otp: string, ttl: number = 5 * 60): Promise<void> {
    const e = this.normalizeEmail(email);
    const otpKey = `otp:email:${e}`
    await redis.set(otpKey, otp, { ex: ttl })
  }

  static async verifyOTP(email: string, otp: string): Promise<boolean> {
    const e = this.normalizeEmail(email);
    const otpKey = `otp:email:${e}`
    const storedOTP = await redis.get(otpKey)
    
    if (!storedOTP) {
      return false
    }
    
    // Constant-time comparison (avoid timing side-channel)
    try {
      const a = Buffer.from(storedOTP);
      const b = Buffer.from(String(otp));
      if (a.length !== b.length) return false;
      return timingSafeEqual(a, b);
    } catch {
      return false;
    }
  }

  static async deleteOTP(email: string): Promise<void> {
    const e = this.normalizeEmail(email);
    const otpKey = `otp:email:${e}`
    await redis.del(otpKey)
  }
}