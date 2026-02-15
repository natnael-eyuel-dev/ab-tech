import { NextRequest, NextResponse } from 'next/server'
import { generateOTP } from '@/lib/otp'
import { OTPRateLimit } from '@/lib/otp-rate-limit'
import { db } from '@/lib/db'
import { validateCaptcha } from '@/lib/captcha'
import { redisConfigured } from '@/lib/redis'
import { sendEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { email, captchaToken, honeypot } = await request.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      )
    }

    if (honeypot && String(honeypot).trim().length > 0) {
      return NextResponse.json(
        { error: 'Spam detected' },
        { status: 400 }
      )
    }

    // Require captcha when configured (Cloudflare Turnstile)
    const remoteip = request.headers.get('x-forwarded-for') || undefined
    const captchaOk = await validateCaptcha(captchaToken, remoteip)
    if (!captchaOk) {
      return NextResponse.json(
        { error: 'Captcha verification failed' },
        { status: 400 }
      )
    }

    // Check if request is allowed (rate limiting)
    const rateLimitCheck = await OTPRateLimit.isRequestAllowed(email)
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { 
          error: 'Too many requests. Please wait before trying again.',
          nextAttemptIn: rateLimitCheck.nextAttemptIn 
        },
        { status: 429 }
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

    // Production safety: OTP flow requires a real Redis backend for TTL/rate-limits.
    if (process.env.NODE_ENV === 'production' && !redisConfigured) {
      return NextResponse.json(
        { error: 'OTP service temporarily unavailable (Redis not configured)' },
        { status: 503 }
      )
    }

    // Generate OTP
    const otp = generateOTP(6)
    
    // Store OTP in Redis
    await OTPRateLimit.storeOTP(email, otp)

    // Check if user exists
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    // Send OTP via email (SMTP / nodemailer)
    try {
      const codeExpiresInMinutes = 5
      const safeEmail = email.toLowerCase()

      await sendEmail({
        to: safeEmail,
        subject: 'Your AB TECH sign-in code',
        text: `Your one-time code is ${otp}. It expires in ${codeExpiresInMinutes} minutes.\n\nIf you did not request this, you can ignore this email.`,
        html: `
          <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; line-height: 1.4;">
            <h2 style="margin:0 0 12px 0;">Your sign-in code</h2>
            <p style="margin:0 0 12px 0;">Use this one-time code to sign in:</p>
            <div style="font-size: 28px; font-weight: 700; letter-spacing: 6px; margin: 8px 0 16px 0;">${otp}</div>
            <p style="margin:0 0 12px 0;color:#444;">This code expires in ${codeExpiresInMinutes} minutes.</p>
            <p style="margin:0;color:#666;font-size:12px;">If you did not request this, you can safely ignore this email.</p>
          </div>
        `.trim(),
      })

      return NextResponse.json({
        message: 'OTP sent successfully',
        userExists: !!user
      })
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError)
      return NextResponse.json(
        { error: 'Failed to send OTP. Please try again.' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('OTP request error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}