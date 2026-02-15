import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Admin routes protection: require authenticated ADMIN
  if (pathname.startsWith('/admin')) {
    const token = await getToken({ req: request });
    const role = token?.role;
    if (!token || role !== 'ADMIN') {
      const redirectUrl = '/auth/signin?redirect=' + encodeURIComponent(pathname);
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    // Add other protected routes as needed
  ],
};