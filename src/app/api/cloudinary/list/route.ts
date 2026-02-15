import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { ServerCloudinaryService } from '@/lib/cloudinary-server'

export async function GET(req: Request) {
  try {
    const token = await getToken({ req: req as any })
    if (!(token && (token as any).role === 'ADMIN')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const url = new URL(req.url)
    const prefix = url.searchParams.get('prefix') || ''

    const cfg = ServerCloudinaryService.getConfigStatus()
    if (!cfg.configured) {
      return NextResponse.json({ success: false, error: 'Cloudinary not configured on server' }, { status: 500 })
    }

    const res = await ServerCloudinaryService.listImages(prefix, { max_results: 100 })
    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error }, { status: 500 })
    }
    return NextResponse.json({ success: true, data: res.data })
  } catch (e) {
    console.error('Cloudinary list route error:', e)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
