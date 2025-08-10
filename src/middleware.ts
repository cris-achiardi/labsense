import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isAuth = !!token
    const isAuthPage = req.nextUrl.pathname.startsWith('/auth')
    const isDashboard = req.nextUrl.pathname.startsWith('/dashboard')
    const isAdmin = req.nextUrl.pathname.startsWith('/admin')

    // Redirect authenticated users away from auth pages
    if (isAuthPage && isAuth) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // Check admin access
    if (isAdmin && (!isAuth || token?.role !== 'admin')) {
      return NextResponse.redirect(new URL('/auth/signin', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname

        // Allow access to public pages
        if (pathname.startsWith('/auth') ||
            pathname.startsWith('/demo') ||
            pathname.startsWith('/test-db') ||
            pathname.startsWith('/api/auth')) {
          return true
        }
        
        // Require authentication for protected routes (homepage, dashboard, admin, etc.)
        if (pathname === '/' ||
            pathname.startsWith('/dashboard') || 
            pathname.startsWith('/admin')) {
          return !!token
        }

        // Default: allow access to other pages
        return true
      },
    },
  }
)

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}