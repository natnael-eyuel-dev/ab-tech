import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getToken } from 'next-auth/jwt'
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ServerCloudinaryService } from '@/lib/cloudinary-server'

const assetCreateSchema = z.object({
  title: z.string().min(2),
  // Accept either a base64 data URI string or a publicId reference if already uploaded
  data: z.string().min(10).optional(),
  publicId: z.string().optional(),
  bytes: z.number().int().nonnegative().optional(),
  pages: z.number().int().positive().optional(),
  fileType: z.string().default('pdf'),
})

async function requireAdmin(req: NextRequest) {
  const token = await getToken({ req })
  return !!(token && token.role === 'ADMIN')
}

export async function POST(req: NextRequest, { params }: { params: any }) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  // Next.js may provide params as a Promise in some runtimes; await before use
  const { courseId, moduleId } = (await params) as { courseId: string; moduleId: string }
  try {
    const body = await req.json()
    const parsed = assetCreateSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid data', details: parsed.error.flatten() }, { status: 400 })

    // Ensure module belongs to course
  // Use the Prisma delegate name as generated: courseModule (model CourseModule becomes courseModule)
  const courseModuleRecord = await db.courseModule.findFirst({ where: { id: moduleId, courseId } })
  if (!courseModuleRecord) return NextResponse.json({ error: 'Module not found' }, { status: 404 })

    let publicId = parsed.data.publicId
    if (!publicId && parsed.data.data) {
      const uploadRes = await ServerCloudinaryService.uploadPdf(parsed.data.data)
      if (!uploadRes.success || !uploadRes.data) {
        return NextResponse.json({ error: 'Upload failed', details: uploadRes.error }, { status: 500 })
      }
      publicId = (uploadRes.data as any).public_id
    }

    if (!publicId) {
      return NextResponse.json({ error: 'Missing asset data or publicId' }, { status: 400 })
    }

  const count = await db.courseAsset.count({ where: { moduleId } })
  const asset = await db.courseAsset.create({
      data: {
        moduleId,
        title: parsed.data.title,
        publicId,
        fileType: parsed.data.fileType,
        bytes: parsed.data.bytes,
        pages: parsed.data.pages,
        order: count,
      },
    })

    return NextResponse.json({ asset })
  } catch (e) {
    console.error('Create asset error:', e)
    return NextResponse.json({ error: 'Failed to create asset' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: any }) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  // Await params in case runtime provides them as a promise
  const { courseId, moduleId } = (await params) as { courseId: string; moduleId: string }
  try {
    const body = await req.json()
    if (body.reorder && Array.isArray(body.reorder)) {
      for (const item of body.reorder) {
        if (item.id && typeof item.order === 'number') {
          await db.courseAsset.update({ where: { id: item.id }, data: { order: item.order } })
        }
      }
      return NextResponse.json({ success: true })
    }
    return NextResponse.json({ error: 'Unsupported operation' }, { status: 400 })
  } catch (e) {
    console.error('Reorder assets error:', e)
    return NextResponse.json({ error: 'Failed to reorder assets' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: any }) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  // Await params in case runtime provides them as a promise
  const { courseId, moduleId } = (await params) as { courseId: string; moduleId: string }
  try {
    const url = new URL(req.url)
    const id = url.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const asset = await db.courseAsset.findUnique({ where: { id } })
    if (!asset) return NextResponse.json({ error: 'Asset not found' }, { status: 404 })

    // Attempt Cloudinary deletion; ignore failure (asset record removal proceeds)
    if (asset.publicId) {
      await ServerCloudinaryService.deleteResource(asset.publicId, 'raw')
    }

    await db.courseAsset.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Delete asset error:', e)
    return NextResponse.json({ error: 'Failed to delete asset' }, { status: 500 })
  }
}
