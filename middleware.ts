import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    if (path === '/') {
      return NextResponse.redirect(new URL(token ? '/dashboard' : '/login', req.url))
    }

    if (path === '/login' && token) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname
        // Allow login and root through; root redirects inside middleware
        if (path === '/login' || path === '/') return true
        return !!token
      },
    },
    pages: {
      signIn: '/login',
    },
  }
)

export const config = {
  matcher: [
    '/',
    '/login',
    '/dashboard/:path*',
    '/trips/:path*',
    '/masters/:path*',
    '/analytics/:path*',
    '/invoices/:path*',
    '/settings/:path*',
    '/account/:path*',
  ],
}
