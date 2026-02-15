import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const q = (searchParams.get('q') || '').trim().toLowerCase()
    const type = searchParams.get('type') || undefined
    const location = searchParams.get('location') || undefined

    const where: any = { active: true }
    if (type) where.type = type
    if (location) where.location = { contains: location, mode: 'insensitive' as any }

    const jobs = await (db as any).job.findMany({ where, orderBy: { postedAt: 'desc' } })

    const filtered = q
      ? jobs.filter((j: any) => {
          const hay = `${j.title} ${j.company} ${j.location} ${j.description} ${j.tags || ''}`.toLowerCase()
          return hay.includes(q)
        })
      : jobs

    const abtech = filtered.filter((j: any) => j.source === 'ABTECH')
    const external = filtered.filter((j: any) => j.source === 'EXTERNAL')

    return NextResponse.json({ abtech, external })
  } catch (e) {
    console.error('Jobs GET error', e)
    return NextResponse.json({ abtech: [], external: [] })
  }
}
