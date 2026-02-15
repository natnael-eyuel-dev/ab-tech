import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Eye } from 'lucide-react'
import { CourseCard, type Course } from '@/components/courses/course-card'
import { headers } from 'next/headers'
import PageHero from '@/components/shared/PageHero'

async function getCourses() {
  const h = await headers()
  // Derive host for absolute URL to avoid ERR_INVALID_URL when using relative on server
  const host = h.get('x-forwarded-host') || h.get('host') || process.env.NEXT_PUBLIC_HOSTNAME || ''
  const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https'
  const base = host ? `${protocol}://${host}` : ''
  const res = await fetch(`${base}/api/courses`, { cache: 'no-store' })
  if (!res.ok) return { courses: [] as any[] }
  return res.json()
}

export const metadata = {
  title: 'Courses — AB TECH',
  description: 'Structured, multi-module courses and PDFs curated by AB TECH.',
}

export default async function CoursesPage() {
  const { courses } = await getCourses()
  return (
    <div className="">
      <PageHero
        title="Courses"
        subtitle="Deep-dive, structured learning. Each course is broken into focused modules and downloadable assets so you can learn efficiently without fluff."
        badge="Courses"
      />

      {/* Grid with spacing from hero */}
      <div className="container mx-auto px-4 pt-8 pb-16 max-w-6xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((c: any) => (
          <CourseCard key={c.id} course={c as Course} />
        ))}
        {courses.length === 0 && (
          <div className="col-span-full text-sm text-muted-foreground">No courses yet.</div>
        )}
      </div>
    </div>
  )
}
