import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { ServerCloudinaryService } from '@/lib/cloudinary-server'
import { validateCaptcha } from '@/lib/captcha'
import crypto from 'crypto'

type UploadAuth = 'public' | 'user' | 'admin'
type UploadResourceType = 'image' | 'raw'

const MB = 1024 * 1024

const UPLOAD_POLICIES: Record<string, {
  auth: UploadAuth
  resourceType: UploadResourceType
  maxBytes: number
  acceptedTypes: string[]
  allowClientTransformation?: boolean
}> = {
  // Public upload used by Careers page for resume PDFs
  applications: {
    auth: 'public',
    resourceType: 'raw',
    maxBytes: 10 * MB,
    acceptedTypes: ['application/pdf'],
  },

  // Typical logged-in uploads
  avatars: {
    auth: 'user',
    resourceType: 'image',
    maxBytes: 2 * MB,
    acceptedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },

  // Admin-only uploads
  covers: {
    auth: 'admin',
    resourceType: 'image',
    maxBytes: 5 * MB,
    acceptedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },
  uploads: {
    auth: 'admin',
    resourceType: 'image',
    maxBytes: 8 * MB,
    acceptedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    allowClientTransformation: true,
  },
}

async function requireRole(req: NextRequest, auth: UploadAuth) {
  if (auth === 'public') return { ok: true as const, token: null as any }
  const token = await getToken({ req })
  if (!token) return { ok: false as const, token: null as any }
  if (auth === 'admin' && (token as any).role !== 'ADMIN') return { ok: false as const, token }
  return { ok: true as const, token }
}

function sanitizeTransformation(input: string | null, enabled: boolean): any[] | undefined {
  if (!enabled || !input) return undefined
  try {
    const parsed = JSON.parse(input)
    if (!Array.isArray(parsed)) return undefined

    // Allow a small, safe subset of transformation keys
    const safe: any[] = []
    for (const t of parsed.slice(0, 5)) {
      if (!t || typeof t !== 'object') continue
      const out: any = {}
      if (typeof (t as any).width === 'number') out.width = Math.max(1, Math.min(4000, (t as any).width))
      if (typeof (t as any).height === 'number') out.height = Math.max(1, Math.min(4000, (t as any).height))
      if (typeof (t as any).crop === 'string') out.crop = (t as any).crop
      if (typeof (t as any).gravity === 'string') out.gravity = (t as any).gravity
      if (typeof (t as any).quality === 'string' || typeof (t as any).quality === 'number') out.quality = (t as any).quality
      if (typeof (t as any).format === 'string') out.format = (t as any).format
      if (Object.keys(out).length > 0) safe.push(out)
    }
    return safe.length ? safe : undefined
  } catch {
    return undefined
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = (formData.get('folder') as string) || 'uploads'
    const transformation = (formData.get('transformation') as string) || null
    const captchaToken = (formData.get('captchaToken') as string) || undefined
    const honeypot = (formData.get('honeypot') as string) || ''
    if (honeypot && String(honeypot).trim().length > 0) {
      return NextResponse.json({ error: 'Spam detected' }, { status: 400 })
    }

    const policy = UPLOAD_POLICIES[folder]
    if (!policy) {
      return NextResponse.json({ error: 'Invalid upload folder' }, { status: 400 })
    }

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Auth gating based on folder/purpose
    const roleCheck = await requireRole(request, policy.auth)
    if (!roleCheck.ok) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Captcha: required when configured for public uploads; allowed for others but not required
    if (policy.auth === 'public') {
      const remoteip = request.headers.get('x-forwarded-for') || undefined
      const captchaOk = await validateCaptcha(captchaToken, remoteip)
      if (!captchaOk) {
        return NextResponse.json({ error: 'Captcha verification failed' }, { status: 400 })
      }
    }

    // Validate file type + size
    const contentType = (file as any)?.type || 'application/octet-stream'
    if (!policy.acceptedTypes.includes(contentType)) {
      return NextResponse.json({ error: `Invalid file type: ${contentType}` }, { status: 400 })
    }
    const fileSize = (file as any)?.size as number | undefined
    if (typeof fileSize === 'number' && fileSize > policy.maxBytes) {
      return NextResponse.json({ error: `File too large (max ${(policy.maxBytes / MB).toFixed(0)}MB)` }, { status: 400 })
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    if (buffer.byteLength > policy.maxBytes) {
      return NextResponse.json({ error: `File too large (max ${(policy.maxBytes / MB).toFixed(0)}MB)` }, { status: 400 })
    }

    const parsedTransformation = sanitizeTransformation(transformation, !!policy.allowClientTransformation)

    // Check if Cloudinary is configured
    if (!ServerCloudinaryService.isConfigured()) {
      return NextResponse.json(
        { error: 'Cloudinary is not configured. Please check your environment variables.' },
        { status: 500 }
      )
    }

    // Upload to Cloudinary with server-enforced policy
    let result: any
    if (policy.resourceType === 'raw') {
      // PDF resumes, etc.
      const public_id = `resume_${Date.now()}_${crypto.randomUUID()}`
      result = await ServerCloudinaryService.uploadPdf(buffer, { folder, public_id, overwrite: false })
    } else {
      result = await ServerCloudinaryService.uploadImage(buffer, {
        folder,
        transformation: parsedTransformation,
        resource_type: 'image',
        contentType,
        overwrite: true,
      })
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        url: result?.data?.secure_url,
        publicId: result?.data?.public_id,
        width: result?.data?.width,
        height: result?.data?.height,
        format: result?.data?.format,
        size: result?.data?.bytes,
        createdAt: result?.data?.created_at,
      },
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Deletion is admin-only to prevent arbitrary asset destruction
    const token = await getToken({ req: request })
    if (!(token && (token as any).role === 'ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { publicId, resourceType } = await request.json().catch(() => ({}))

    if (!publicId) {
      return NextResponse.json(
        { error: 'Public ID is required' },
        { status: 400 }
      )
    }

    // Check if Cloudinary is configured
    if (!ServerCloudinaryService.isConfigured()) {
      return NextResponse.json(
        { error: 'Cloudinary is not configured. Please check your environment variables.' },
        { status: 500 }
      )
    }

    const rt: UploadResourceType = resourceType === 'raw' ? 'raw' : 'image'
    const result = rt === 'raw'
      ? await ServerCloudinaryService.deleteResource(publicId, 'raw')
      : await ServerCloudinaryService.deleteImage(publicId)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully',
    })

  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}