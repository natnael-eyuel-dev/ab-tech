import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { ServerCloudinaryService } from '@/lib/cloudinary-server'

export async function GET(req: Request) {
  try {
    const token = await getToken({ req: req as any })
    if (!(token && (token as any).role === 'ADMIN')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    // Report server-side Cloudinary config so we can quickly see if credentials are present
    const cfg = ServerCloudinaryService.getConfigStatus()
    if (!cfg.configured) {
      return NextResponse.json({ success: false, error: 'Cloudinary not configured on server' }, { status: 500 })
    }
    const url = new URL(req.url)
    const publicId = url.searchParams.get('publicId')
    if (!publicId) return NextResponse.json({ error: 'Missing publicId' }, { status: 400 })

    const info = await ServerCloudinaryService.getImageInfo(publicId)
    if (!info.success) {
      return NextResponse.json({ success: false, error: info.error }, { status: 500 })
    }
    return NextResponse.json({ success: true, data: info.data })
  } catch (e) {
    console.error('Cloudinary info route error:', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
