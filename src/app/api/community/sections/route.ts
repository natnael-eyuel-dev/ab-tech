import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const sections = await (db as any).communitySection.findMany()
  const result: Record<string, any> = {}
  for (const s of sections) {
    result[s.key] = s.data
  }
  return NextResponse.json(result)
}
