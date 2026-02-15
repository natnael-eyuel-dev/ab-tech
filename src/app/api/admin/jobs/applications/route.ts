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
  const { searchParams } = new URL(req.url)
  const jobId = searchParams.get('jobId') || undefined
  const where: any = {}
  if (jobId) where.jobId = jobId
  const apps = await (db as any).jobApplication.findMany({ where, orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ applications: apps })
}

export async function PATCH(req: NextRequest) {
  const isAdmin = await requireAdmin(req)
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await req.json()
    const { id, status } = body || {}
    if (!id || !status) return NextResponse.json({ error: 'Missing id or status' }, { status: 400 })
    const updated = await (db as any).jobApplication.update({ where: { id }, data: { status } })
    return NextResponse.json({ success: true, application: updated })
  } catch (e) {
    console.error('Admin apps PATCH error', e)
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
    await (db as any).jobApplication.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Admin apps DELETE error', e)
    return NextResponse.json({ error: 'Bad Request' }, { status: 400 })
  }
}
