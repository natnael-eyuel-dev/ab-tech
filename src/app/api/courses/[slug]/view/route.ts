import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(_req: Request, { params }: { params: any }) {
  try {
    const p = await params
    const slug = p?.slug
    const updated = await db.course.update({
      where: { slug },
      data: { views: { increment: 1 } },
      select: { id: true, views: true }
    })
    return NextResponse.json({ id: updated.id, views: updated.views })
  } catch (e) {
    // If not found or other error, don't hard fail
    return NextResponse.json({ success: false })
  }
}
