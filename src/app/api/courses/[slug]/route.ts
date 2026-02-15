import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_req: Request, { params }: { params: any }) {
  try {
    // `params` may be an async wrapper in the App Router — await it before
    // accessing properties per Next.js guidance: sync-dynamic-apis
    const p = await params
    const slug = p?.slug

    const course = await db.course.findUnique({
      where: { slug },
      include: {
        modules: {
          orderBy: { order: 'asc' },
          include: { assets: { orderBy: { order: 'asc' } } }
        }
      }
    })
    if (!course || !course.published || course.status !== 'PUBLISHED') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    // shape response
    return NextResponse.json({ course })
  } catch (e) {
    console.error('Course detail error:', e)
    return NextResponse.json({ error: 'Failed to load course' }, { status: 500 })
  }
}
