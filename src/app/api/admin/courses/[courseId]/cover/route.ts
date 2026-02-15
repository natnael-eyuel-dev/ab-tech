import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'
import { z } from 'zod'
import { ServerCloudinaryService } from '@/lib/cloudinary-server'

const bodySchema = z.object({
  data: z.string().min(10).optional(), 
  url: z.string().url().optional(),    
  publicId: z.string().optional(),     
})

async function requireAdmin(req: NextRequest) {
  const token = await getToken({ req })
  return !!(token && token.role === 'ADMIN')
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ courseId: string }> }) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  try {
    const { courseId } = await ctx.params
    // Validate course exists
    const course = await db.course.findUnique({ where: { id: courseId } })
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    const json = await req.json().catch(() => ({}))
    const parsed = bodySchema.safeParse(json)
    if (!parsed.success || (!parsed.data.data && !parsed.data.url)) {
      return NextResponse.json({ error: 'Invalid body: provide data (base64) or url' }, { status: 400 })
    }

    let uploadRes: any
    const public_id = parsed.data.publicId || `covers/course_${courseId}_${Date.now()}`

    if (parsed.data.data) {
      uploadRes = await ServerCloudinaryService.uploadImage(parsed.data.data, {
        folder: 'covers',
        public_id,
        transformation: [
          { width: 800, height: 400, crop: 'fill', gravity: 'auto' },
          { quality: 'auto' },
          { format: 'auto' },
        ],
        resource_type: 'image',
      })
    } else if (parsed.data.url) {
      uploadRes = await ServerCloudinaryService.uploadImageFromUrl(parsed.data.url, {
        folder: 'covers',
        public_id,
        transformation: [
          { width: 800, height: 400, crop: 'fill', gravity: 'auto' },
          { quality: 'auto' },
          { format: 'auto' },
        ],
      })
    }

    if (!uploadRes?.success) {
      // Fallback: if a direct URL was provided, store it to allow external image rendering
      if (parsed.data.url) {
        const updated = await db.course.update({
          where: { id: courseId },
          data: { coverImage: parsed.data.url },
        })
        return NextResponse.json({ course: updated, warning: 'Cloudinary upload failed; using external URL' })
      }
      return NextResponse.json({ error: uploadRes?.error || 'Upload failed' }, { status: 400 })
    }

    const updated = await db.course.update({
      where: { id: courseId },
      data: { coverImage: uploadRes.data.public_id },
    })

    return NextResponse.json({ course: updated, asset: uploadRes.data })
  } catch (e) {
    console.error('Upload course cover error:', e)
    return NextResponse.json({ error: 'Failed to upload cover' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ courseId: string }> }) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  try {
    const { courseId } = await ctx.params
    const course = await db.course.findUnique({ where: { id: courseId } })
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }
    const current = course.coverImage || ''
    // If it's a Cloudinary public id (no protocol), attempt delete
    const isExternal = /^https?:\/\//i.test(current)
    if (current && !isExternal) {
      await ServerCloudinaryService.deleteImage(current)
    }
    const updated = await db.course.update({ where: { id: courseId }, data: { coverImage: null } })
    return NextResponse.json({ course: updated, removed: true })
  } catch (e) {
    console.error('Remove course cover error:', e)
    return NextResponse.json({ error: 'Failed to remove cover' }, { status: 500 })
  }
}
