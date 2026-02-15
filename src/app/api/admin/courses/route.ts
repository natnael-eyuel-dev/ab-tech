import { NextResponse, NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getToken } from 'next-auth/jwt'
import { z } from 'zod'

// Schemas
const createCourseSchema = z.object({
  title: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9\-]+$/),
  description: z.string().optional(),
  coverImage: z.string().url().optional(),
  level: z.enum(['BEGINNER','INTERMEDIATE','ADVANCED']).optional(),
  status: z.enum(['DRAFT','PUBLISHED','ARCHIVED']).optional(),
})

const updateCourseSchema = createCourseSchema.partial().extend({ id: z.string().cuid() })

async function requireAdmin(req: NextRequest) {
  const token = await getToken({ req })
  if (!token || token.role !== 'ADMIN') {
    return false
  }
  return true
}

export async function GET() {
  try {
    const courses = await db.course.findMany({
      orderBy: { createdAt: 'desc' },
      include: { modules: { include: { assets: true } } }
    })
    return NextResponse.json({ courses })
  } catch (e) {
    console.error('Admin list courses error:', e)
    return NextResponse.json({ error: 'Failed to list courses' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  try {
    const body = await req.json()
    const parsed = createCourseSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data', details: parsed.error.flatten() }, { status: 400 })
    }
  const existingSlug = await db.course.findUnique({ where: { slug: parsed.data.slug } })
    if (existingSlug) {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 409 })
    }
    const course = await db.course.create({
      data: {
        title: parsed.data.title,
        slug: parsed.data.slug,
        description: parsed.data.description,
        coverImage: parsed.data.coverImage,
        level: parsed.data.level || 'BEGINNER',
        status: parsed.data.status || 'DRAFT',
        published: parsed.data.status === 'PUBLISHED',
      },
    })
    return NextResponse.json({ course })
  } catch (e) {
    console.error('Create course error:', e)
    return NextResponse.json({ error: 'Failed to create course' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  try {
    const body = await req.json()
    const parsed = updateCourseSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data', details: parsed.error.flatten() }, { status: 400 })
    }
    const { id, ...rest } = parsed.data
    if (rest.slug) {
      const conflict = await db.course.findFirst({ where: { slug: rest.slug, NOT: { id } } })
      if (conflict) {
        return NextResponse.json({ error: 'Slug already taken' }, { status: 409 })
      }
    }
    const course = await db.course.update({
      where: { id },
      data: {
        ...rest,
        published: rest.status === 'PUBLISHED' ? true : undefined,
      },
    })
    return NextResponse.json({ course })
  } catch (e) {
    console.error('Update course error:', e)
    return NextResponse.json({ error: 'Failed to update course' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  try {
    const url = new URL(req.url)
    const id = url.searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }
    await db.course.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Delete course error:', e)
    return NextResponse.json({ error: 'Failed to delete course' }, { status: 500 })
  }
}
