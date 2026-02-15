import { NextResponse, NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getToken } from 'next-auth/jwt'
import { z } from 'zod'

const moduleCreateSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
})

const moduleUpdateSchema = z.object({
  id: z.string().cuid(),
  title: z.string().min(2).optional(),
  description: z.string().optional(),
  order: z.number().int().nonnegative().optional(),
})

async function requireAdmin(req: NextRequest) {
  const token = await getToken({ req })
  return !!(token && token.role === 'ADMIN')
}

export async function POST(req: NextRequest, { params }: { params: any }) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  try {
    const p = await params
    const courseId = p?.courseId
    const body = await req.json()
    const parsed = moduleCreateSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid data', details: parsed.error.flatten() }, { status: 400 })

    // Determine next order
    const count = await db.courseModule.count({ where: { courseId } })
    const mod = await db.courseModule.create({
      data: {
        courseId,
        title: parsed.data.title,
        description: parsed.data.description,
        order: count,
      },
    })

    return NextResponse.json({ module: mod })
  } catch (e) {
    console.error('Create module error:', e)
    return NextResponse.json({ error: 'Failed to create module' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: any }) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  try {
    const p = await params
    const courseId = p?.courseId
    const body = await req.json()
    // Allow batch reorder: { reorder: [{id, order}, ...] }
    if (body.reorder && Array.isArray(body.reorder)) {
      for (const item of body.reorder) {
        if (item.id && typeof item.order === 'number') {
          await db.courseModule.update({ where: { id: item.id }, data: { order: item.order } })
        }
      }
      return NextResponse.json({ success: true })
    }

    const parsed = moduleUpdateSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid data', details: parsed.error.flatten() }, { status: 400 })

    const { id, ...rest } = parsed.data
    const updated = await db.courseModule.update({ where: { id }, data: rest })
    return NextResponse.json({ module: updated })
  } catch (e) {
    console.error('Update module error:', e)
    return NextResponse.json({ error: 'Failed to update module' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: any }) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  try {
    const p = await params
    const courseId = p?.courseId
    const url = new URL(req.url)
    const id = url.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    await db.courseModule.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Delete module error:', e)
    return NextResponse.json({ error: 'Failed to delete module' }, { status: 500 })
  }
}
