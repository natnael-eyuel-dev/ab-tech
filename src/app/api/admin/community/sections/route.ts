import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'

const ALLOWED_KEYS = new Set([
  'trendingTopics',
  'recentDiscussions',
  'upcomingEvents',
  'featuredMembers',
])

async function requireAdmin(req: NextRequest) {
  const token = await getToken({ req })
  const role = (token as any)?.role
  if (!token || (role !== 'ADMIN' && role !== 'MODERATOR')) {
    return false
  }
  return true
}

export async function GET(req: NextRequest) {
  const isAdmin = await requireAdmin(req)
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sections = await (db as any).communitySection.findMany()
  const result: Record<string, any> = {}
  for (const s of sections) {
    result[s.key] = s.data
  }
  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  const isAdmin = await requireAdmin(req)
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { key, data } = body || {}
    if (!key || !ALLOWED_KEYS.has(key)) {
      return NextResponse.json({ error: 'Invalid key' }, { status: 400 })
    }

    const saved = await (db as any).communitySection.upsert({
      where: { key },
      update: { data },
      create: { key, data },
    })
    return NextResponse.json({ success: true, section: saved })
  } catch (e) {
    console.error('Admin community POST error', e)
    return NextResponse.json({ error: 'Bad Request' }, { status: 400 })
  }
}

export async function PATCH(req: NextRequest) {
  const isAdmin = await requireAdmin(req)
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { key, index, item, op } = body || {}
    if (!key || !ALLOWED_KEYS.has(key)) {
      return NextResponse.json({ error: 'Invalid key' }, { status: 400 })
    }

    const existing = await (db as any).communitySection.findUnique({ where: { key } })
    const arr: any[] = Array.isArray(existing?.data) ? [...existing.data] : []

    if (op === 'add' || index === undefined || index === null) {
      arr.push(item)
    } else {
      const i = Number(index)
      if (Number.isNaN(i) || i < 0 || i >= Math.max(1, arr.length)) {
        return NextResponse.json({ error: 'Invalid index' }, { status: 400 })
      }
      arr[i] = item
    }

    const saved = await (db as any).communitySection.upsert({
      where: { key },
      update: { data: arr },
      create: { key, data: arr },
    })
    return NextResponse.json({ success: true, section: saved })
  } catch (e) {
    console.error('Admin community PATCH error', e)
    return NextResponse.json({ error: 'Bad Request' }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest) {
  const isAdmin = await requireAdmin(req)
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { key, index } = body || {}
    if (!key || !ALLOWED_KEYS.has(key)) {
      return NextResponse.json({ error: 'Invalid key' }, { status: 400 })
    }
    const i = Number(index)
    if (Number.isNaN(i) || i < 0) {
      return NextResponse.json({ error: 'Invalid index' }, { status: 400 })
    }
    const existing = await (db as any).communitySection.findUnique({ where: { key } })
    const arr: any[] = Array.isArray(existing?.data) ? [...existing.data] : []
    if (i >= arr.length) {
      return NextResponse.json({ error: 'Index out of range' }, { status: 400 })
    }
    arr.splice(i, 1)
    const saved = await (db as any).communitySection.upsert({
      where: { key },
      update: { data: arr },
      create: { key, data: arr },
    })
    return NextResponse.json({ success: true, section: saved })
  } catch (e) {
    console.error('Admin community DELETE error', e)
    return NextResponse.json({ error: 'Bad Request' }, { status: 400 })
  }
}