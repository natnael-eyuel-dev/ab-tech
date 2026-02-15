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
  const existing = await (db as any).communitySection.findUnique({ where: { key: 'contactFaqs' } })
  const faqs = Array.isArray(existing?.data) ? existing!.data : []
  return NextResponse.json({ faqs })
}

export async function PATCH(req: NextRequest) {
  const isAdmin = await requireAdmin(req)
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await req.json()
    const { index, item, op } = body || {}

    const existing = await (db as any).communitySection.findUnique({ where: { key: 'contactFaqs' } })
    const arr: any[] = Array.isArray(existing?.data) ? [...existing!.data] : []

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
      where: { key: 'contactFaqs' },
      update: { data: arr },
      create: { key: 'contactFaqs', data: arr },
    })
    return NextResponse.json({ success: true, faqs: saved.data })
  } catch (e) {
    console.error('Admin contact FAQs PATCH error', e)
    return NextResponse.json({ error: 'Bad Request' }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest) {
  const isAdmin = await requireAdmin(req)
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { index } = body || {}
    const i = Number(index)
    if (Number.isNaN(i) || i < 0) return NextResponse.json({ error: 'Invalid index' }, { status: 400 })

    const existing = await (db as any).communitySection.findUnique({ where: { key: 'contactFaqs' } })
    const arr: any[] = Array.isArray(existing?.data) ? [...existing!.data] : []
    if (i >= arr.length) return NextResponse.json({ error: 'Index out of range' }, { status: 400 })
    arr.splice(i, 1)

    const saved = await (db as any).communitySection.upsert({
      where: { key: 'contactFaqs' },
      update: { data: arr },
      create: { key: 'contactFaqs', data: arr },
    })
    return NextResponse.json({ success: true, faqs: saved.data })
  } catch (e) {
    console.error('Admin contact FAQs DELETE error', e)
    return NextResponse.json({ error: 'Bad Request' }, { status: 400 })
  }
}
