import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/public(.*)',
  '/api/webhooks(.*)',
  '/',
])

const isAdminRoute = createRouteMatcher(['/admin(.*)'])
const isSuperAdminRoute = createRouteMatcher(['/super-admin(.*)'])
const isTeacherRoute = createRouteMatcher(['/teacher(.*)'])
const isStudentRoute = createRouteMatcher(['/student(.*)'])

export default clerkMiddleware(async (auth, req) => {
  // Allow public routes without auth
  if (isPublicRoute(req)) return NextResponse.next()

  try {
    const { userId, sessionClaims } = await auth()

    // Not logged in
    if (!userId) {
      return NextResponse.redirect(new URL('/sign-in', req.url))
    }

    const role = (sessionClaims?.metadata as { role?: string } | undefined)?.role

    // No role — send to unauthorized not sign-in (prevents loop)
    if (!role) {
      if (req.nextUrl.pathname === '/unauthorized') {
        return NextResponse.next()
      }
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }

    // Role-based access control
    if (isSuperAdminRoute(req) && role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }
    if (isAdminRoute(req) && !['ADMIN', 'SUPER_ADMIN'].includes(role)) {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }
    if (isTeacherRoute(req) && role !== 'TEACHER') {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }
    if (isStudentRoute(req) && role !== 'STUDENT') {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }

    return NextResponse.next()
  } catch (error) {
    // If Clerk API is unreachable, allow the request through
    // The layout will handle auth — better than crashing
    console.error('Middleware auth error:', error)

    // If going to sign-in already, let it through
    if (req.nextUrl.pathname.startsWith('/sign-in')) {
      return NextResponse.next()
    }

    // For other routes, redirect to sign-in on auth failure
    return NextResponse.redirect(new URL('/sign-in', req.url))
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
