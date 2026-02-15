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
  const jobs = await (db as any).job.findMany({ orderBy: { postedAt: 'desc' } })
  return NextResponse.json({ jobs })
}

export async function POST(req: NextRequest) {
  const isAdmin = await requireAdmin(req)
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await req.json()
    const created = await (db as any).job.create({ data: body })
    return NextResponse.json({ success: true, job: created })
  } catch (e) {
    console.error('Admin jobs POST error', e)
    return NextResponse.json({ error: 'Bad Request' }, { status: 400 })
  }
}

export async function PATCH(req: NextRequest) {
  const isAdmin = await requireAdmin(req)
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await req.json()
    const { id, ...data } = body || {}
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    const updated = await (db as any).job.update({ where: { id }, data })
    return NextResponse.json({ success: true, job: updated })
  } catch (e) {
    console.error('Admin jobs PATCH error', e)
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
    await (db as any).job.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Admin jobs DELETE error', e)
    return NextResponse.json({ error: 'Bad Request' }, { status: 400 })
  }
}
