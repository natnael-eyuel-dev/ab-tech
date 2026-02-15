import { NextRequest, NextResponse } from 'next/server'
import { OTPRateLimit } from '@/lib/otp-rate-limit'
import { db } from '@/lib/db'
import redis, { redisConfigured } from '@/lib/redis'
import { randomUUID } from 'node:crypto'

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json()

    if (!email || !email.includes('@') || !otp) {
      return NextResponse.json(
        { error: 'Email and OTP are required' },
        { status: 400 }
      )
    }

    // Check if account is blocked
    const rateLimitInfo = await OTPRateLimit.getRateLimitInfo(email)
    if (rateLimitInfo.isBlocked) {
      return NextResponse.json(
        { 
          error: 'Account temporarily blocked due to too many failed attempts.',
          blockExpiresIn: rateLimitInfo.blockExpiresIn 
        },
        { status: 429 }
      )
    }

    // Verify OTP
    const isValidOTP = await OTPRateLimit.verifyOTP(email, otp)
    
    if (!isValidOTP) {
      // Record failed attempt
      const newRateLimitInfo = await OTPRateLimit.recordFailedAttempt(email)
      
      if (newRateLimitInfo.isBlocked) {
        return NextResponse.json(
          { 
            error: 'Too many failed attempts. Account temporarily blocked.',
            blockExpiresIn: newRateLimitInfo.blockExpiresIn 
          },
          { status: 429 }
        )
      }
      
      // Generic error message (don't reveal if OTP exists or not)
      return NextResponse.json(
        { error: 'Invalid or expired OTP. Please try again.' },
        { status: 400 }
      )
    }

    // Production safety: OTP flow requires a real Redis backend for TTL/rate-limits.
    if (process.env.NODE_ENV === 'production' && !redisConfigured) {
      return NextResponse.json(
        { error: 'OTP service temporarily unavailable (Redis not configured)' },
        { status: 503 }
      )
    }

    // OTP is valid - check if user exists
    let user = await db.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    // If user doesn't exist, create a new one
    if (!user) {
      try {
        user = await db.user.create({
          data: {
            email: email.toLowerCase(),
            name: email.split('@')[0], // Default name from email
            role: 'FREE_USER',
            emailVerified: true, // Boolean, not DateTime
          }
        })
      } catch (createError) {
        console.error('Failed to create user:', createError)
        return NextResponse.json(
          { error: 'Failed to create user account' },
          { status: 500 }
        )
      }
    }

    // Clean up OTP and reset attempts
    await Promise.all([
      OTPRateLimit.deleteOTP(email),
      OTPRateLimit.resetAttempts(email),
    ])

    // Update user's email verification status if not already verified
    if (!user.emailVerified) {
      await db.user.update({
        where: { id: user.id },
        data: { emailVerified: true }
      })
    }

    // Create a short-lived one-time login token that the Credentials provider must validate.
    // This prevents the unsafe `password === "otp-auth"` bypass from being exploited.
    const loginToken = randomUUID()
    const loginKey = `otp:login_token:${email.toLowerCase()}`
    await redis.set(loginKey, loginToken, { ex: 5 * 60 })

    // Return success response with user info + loginToken
    return NextResponse.json({
      success: true,
      loginToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isPremium: user.premiumExpires && user.premiumExpires > new Date(),
      }
    })

  } catch (error) {
    console.error('OTP verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}