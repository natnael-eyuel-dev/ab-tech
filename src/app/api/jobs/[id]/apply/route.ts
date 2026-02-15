import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateCaptcha } from '@/lib/captcha'

function validate(body: any) {
  const errors: string[] = []
  const req = (v: any, label: string) => { if (!v || (typeof v === 'string' && v.trim() === '')) errors.push(`${label} is required`) }
  req(body.name, 'Name')
  req(body.email, 'Email')
  // resumeUrl optional; coverLetter optional
  return errors
}

export async function POST(req: NextRequest, { params }: { params: any }) {
  try {
    const p = await params
    const jobId = p?.id
    if (!jobId) return NextResponse.json({ error: 'Missing job id' }, { status: 400 })

  const job = await db.job.findUnique({ where: { id: jobId } })
    if (!job || job.active !== true) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

    const body = await req.json()
    if (body?.honeypot && String(body.honeypot).trim().length > 0) {
      return NextResponse.json({ error: 'Spam detected' }, { status: 400 })
    }
    // Require captcha when configured
    const remoteip = req.headers.get('x-forwarded-for') || undefined
    const captchaOk = await validateCaptcha(body?.captchaToken, remoteip)
    if (!captchaOk) {
      return NextResponse.json({ error: 'Captcha verification failed' }, { status: 400 })
    }
    const errors = validate(body)
    if (errors.length) return NextResponse.json({ error: errors[0] }, { status: 400 })

    const app = await db.jobApplication.create({
      data: {
        jobId,
        name: body.name,
        email: body.email,
        phone: body.phone || null,
        linkedin: body.linkedin || null,
        portfolio: body.portfolio || null,
        resumeUrl: body.resumeUrl || null,
        coverLetter: body.coverLetter || null,
      }
    })

    return NextResponse.json({ success: true, application: app })
  } catch (e) {
    console.error('Apply POST error', e)
    return NextResponse.json({ error: 'Bad Request' }, { status: 400 })
  }
}
