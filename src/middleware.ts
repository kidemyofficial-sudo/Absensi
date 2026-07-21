import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth'

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/students', '/attendance', '/reports', '/cabang-daerah', '/guru', '/wali-murid', '/settings', '/pendapatan', '/pengaturan-bagi-hasil']

// Routes that are only for unauthenticated users
const authRoutes = ['/login', '/register']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('token')?.value

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  )

  // Check if route is auth-only
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))

  // If trying to access protected route without token
  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // If trying to access auth route with token
  if (isAuthRoute && token) {
    const session = await verifyToken(token)
    if (session) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    } else {
      // Stale/expired token: clear cookie and allow access to auth route
      const response = NextResponse.next()
      response.cookies.delete('token')
      return response
    }
  }

  // Verify token for protected routes
  if (isProtectedRoute && token) {
    const session = await verifyToken(token)
    if (!session) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('from', pathname)
      const response = NextResponse.redirect(loginUrl)
      response.cookies.delete('token')
      return response
    }

    // Check role-based access
    const ownerOnlyPaths = ['/students', '/guru', '/wali-murid', '/pengaturan-bagi-hasil']
    const isOwnerOnly = ownerOnlyPaths.some(path => pathname.startsWith(path))
    if (isOwnerOnly && session.role !== 'OWNER') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
