import { headers } from 'next/headers'
import CourseModulesClient from '@/components/course/CourseModulesClient'
import PageHero from '@/components/shared/PageHero'

async function getCourse(slug: string) {
  const h = await headers()
  const host = h.get('x-forwarded-host') || h.get('host') || process.env.NEXT_PUBLIC_HOSTNAME || ''
  const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https'
  const base = host ? `${protocol}://${host}` : ''
  const res = await fetch(`${base}/api/courses/${slug}`, { cache: 'no-store' })
  if (!res.ok) return null
  return res.json()
}

function getCloudinaryRawUrl(publicId: string) {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  if (!cloud) {
    console.error('Cloudinary cloud name not configured')
    return ''
  }
  
  if (!publicId) {
    console.error('No publicId provided')
    return ''
  }
  
  // Ensure publicId doesn't already have .pdf extension
  const cleanPublicId = publicId.replace(/\.pdf$/i, '')
  // raw upload URL structure for PDFs stored as raw; do NOT append extension to publicId
  return `https://res.cloudinary.com/${cloud}/raw/upload/${cleanPublicId}`
}

export default async function CourseDetailPage({ params }: { params: any }) {
  // Await params to support Next.js runtime that may provide params as a promise
  const { slug } = (await params) as { slug: string }
  const data = await getCourse(slug)
  if (!data || !data.course) {
    return <div className="container mx-auto px-4 py-10"><p className="text-muted-foreground">Course not found.</p></div>
  }
  const { course } = data

  // Fire and forget view increment (no await on server component)
  fetch(`/api/courses/${slug}/view`, { method: 'POST' }).catch(() => {})

  // Choose an appropriate hero image: prefer course.coverImage, else first module asset
  let heroImage = '/images/hero.png'
  try {
    const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    const cover = course.coverImage || (course.modules && course.modules[0] && course.modules[0].assets && course.modules[0].assets[0] && course.modules[0].assets[0].publicId)
    if (cloud && cover) {
      const clean = String(cover).replace(/\.pdf$/i, '')
      heroImage = `https://res.cloudinary.com/${cloud}/image/upload/c_fill,g_auto,w_1600,h_800,f_auto,q_auto/${clean}`
    }
  } catch (e) {}

  return (
    <div className="min-h-screen bg-background">
      <PageHero
        badge={(course.level || 'BEGINNER').toLowerCase()}
        title={course.title}
        subtitle={course.description || ''}
        imageSrc={heroImage}
        overlayOpacity={0.35}
      />

      <main className="mx-auto max-w-4xl px-4 py-10">
        <CourseModulesClient modules={course.modules} />
      </main>
    </div>
  )
}
