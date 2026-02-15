"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, BookOpen, Check } from "lucide-react"
import { CoverImage } from "@/components/cloudinary-image"

export type Course = {
  id: string
  title: string
  slug: string
  description?: string
  coverImage?: string
  level?: string | null
  views?: number | null
  createdAt?: string
  moduleCount: number
  assetCount: number
  moduleTitles?: string[]
}

export function CourseCard({ course }: { course: Course }) {
  const level = (course.level || "beginner").toString().toLowerCase()
  const accentClass = level === 'advanced'
    ? 'bg-rose-500'
    : level === 'intermediate'
      ? 'bg-amber-500'
      : 'bg-emerald-500'
  const isExternalCover = !!course.coverImage && /^(https?:)?\/\//i.test(course.coverImage)
  const createdAt = course.createdAt ? new Date(course.createdAt) : null
  const isNew = createdAt ? (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24) <= 14 : false
  return (
    <Link href={`/courses/${course.slug}`} className="group block h-full no-underline">
      <Card className={cn("group overflow-hidden hover:shadow-xl transition-all duration-300 h-full flex flex-col relative")}> 
        {/* top accent bar */}
        <div className={cn("absolute left-0 right-0 top-0 h-1", accentClass)} />
        {/* cover */}
        <div className={cn("relative overflow-hidden flex-shrink-0 h-44 md:h-52 bg-muted")}>
          {course.coverImage ? (
            isExternalCover ? (
              <img src={course.coverImage} alt={course.title} className="object-cover w-full h-full" />
            ) : (
              <CoverImage publicId={course.coverImage} alt={course.title} width={800} height={420} className="object-cover w-full h-full" />
            )
          ) : (
            <div className="absolute inset-0 grid place-items-center text-muted-foreground">
              <BookOpen className="h-6 w-6" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
          <div className="absolute left-4 bottom-4">
            <Badge variant="secondary" className="capitalize">{level}</Badge>
          </div>
          {isNew && (
            <div className="absolute right-4 top-3">
              <Badge variant="default">New</Badge>
            </div>
          )}
        </div>

        <CardContent className="p-4 flex-1 flex flex-col">
          <h3 className="font-semibold text-lg leading-tight line-clamp-2 mb-2 group-hover:text-primary transition-colors">{course.title}</h3>
          {course.description ? (
            <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{course.description}</p>
          ) : (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">A focused course to help you level up.</p>
          )}

          {!!course.moduleTitles?.length && (
            <ul className="mb-3 space-y-1">
              {course.moduleTitles.slice(0, 2).map((t, idx) => (
                <li key={idx} className="text-xs text-muted-foreground flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="line-clamp-1">{t}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
            <div>
              <span className="font-medium text-foreground">{course.moduleCount}</span> modules
              <span className="mx-1">•</span>
              <span className="font-medium text-foreground">{course.assetCount}</span> files
            </div>
            <div className="font-medium text-primary no-underline inline-flex items-center gap-1 group-hover:gap-1.5 transition-all">Start <ArrowRight className="h-3 w-3" /></div>
          </div>
        </CardContent>

  <CardFooter className="px-4 pb-4 pt-3">
          <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
            <div>{new Date(course.createdAt || Date.now()).toLocaleDateString()}</div>
            <div className="text-muted-foreground">{course.views ?? 0} views</div>
          </div>
        </CardFooter>
      </Card>
    </Link>
  )
}
