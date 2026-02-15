import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateCaptcha } from '@/lib/captcha'

function validate(body: any) {
  const errors: string[] = []
  const req = (v: any, label: string) => { if (!v || (typeof v === 'string' && v.trim() === '')) errors.push(`${label} is required`) }
  req(body.title, 'Title')
  req(body.company, 'Company')
  req(body.location, 'Location')
  req(body.type, 'Type')
  req(body.description, 'Description')
  req(body.applyUrl, 'Apply URL')
  req(body.contactEmail, 'Contact Email')
  return errors
}

export async function POST(req: NextRequest) {
  try {
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

    const item = await (db as any).jobSubmission.create({
      data: {
        title: body.title,
        company: body.company,
        location: body.location,
        type: body.type,
        description: body.description,
        applyUrl: body.applyUrl,
        contactEmail: body.contactEmail,
        tags: body.tags || null,
        compensationType: body.compensationType || null,
        salaryMin: body.salaryMin ?? null,
        salaryMax: body.salaryMax ?? null,
        currency: body.currency || null,
        remoteType: body.remoteType || null,
        experienceLevel: body.experienceLevel || null,
        // metadata fields for moderation assistance (optional)
        // captchaPassed: true
      }
    })
    return NextResponse.json({ success: true, submission: item })
  } catch (e) {
    console.error('Job submit POST error', e)
    return NextResponse.json({ error: 'Bad Request' }, { status: 400 })
  }
}
