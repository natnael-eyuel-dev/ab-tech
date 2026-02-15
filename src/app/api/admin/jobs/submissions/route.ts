import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'

async function requireAdmin(req: NextRequest) {
  const token = await getToken({ req })
  const role = (token as any)?.role
  if (!token || (role !== 'ADMIN' && role !== 'MODERATOR')) return false
  return true
}

export async function GET(req: NextRequest) {
  const isAdmin = await requireAdmin(req)
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const subs = await (db as any).jobSubmission.findMany({ orderBy: { submittedAt: 'desc' } })
  return NextResponse.json({ submissions: subs })
}

export async function PATCH(req: NextRequest) {
  const isAdmin = await requireAdmin(req)
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await req.json()
    const { id, op } = body || {}
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const sub = await (db as any).jobSubmission.findUnique({ where: { id } })
    if (!sub) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (op === 'approve') {
      // Create a Job from submission
      const job = await (db as any).job.create({
        data: {
          title: sub.title,
          company: sub.company,
          source: 'EXTERNAL',
          location: sub.location,
          type: sub.type,
          description: sub.description,
          applyUrl: sub.applyUrl,
          contactEmail: sub.contactEmail,
          tags: sub.tags || null,
          active: true,
        }
      })
      await (db as any).jobSubmission.update({ where: { id }, data: { status: 'APPROVED', reviewedAt: new Date() } })
      return NextResponse.json({ success: true, job })
    } else if (op === 'reject') {
      await (db as any).jobSubmission.update({ where: { id }, data: { status: 'REJECTED', reviewedAt: new Date() } })
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: 'Invalid op' }, { status: 400 })
    }
  } catch (e) {
    console.error('Admin submissions PATCH error', e)
    return NextResponse.json({ error: 'Bad Request' }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest) {
  const isAdmin = await requireAdmin(req)
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await req.json()
    const { id } = body || {}
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    await (db as any).jobSubmission.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Admin submissions DELETE error', e)
    return NextResponse.json({ error: 'Bad Request' }, { status: 400 })
  }
}
