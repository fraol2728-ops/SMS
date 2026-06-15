import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/public(.*)',
  '/api/webhooks(.*)',
  '/unauthorized',
  '/',
])

const isAdminRoute = createRouteMatcher(['/admin(.*)'])
const isSuperAdminRoute = createRouteMatcher(['/super-admin(.*)'])
const isTeacherRoute = createRouteMatcher(['/teacher(.*)'])
const isStudentRoute = createRouteMatcher(['/student(.*)'])

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return NextResponse.next()

  try {
    const { userId, sessionClaims } = await auth()

    if (!userId) {
      return NextResponse.redirect(new URL('/sign-in', req.url))
    }

    const role = (sessionClaims?.metadata as any)?.role as string | undefined

    if (!role) {
      // User is signed in but has no role
      // Send to home page — NOT /unauthorized (that causes loop)
      // Home page will show "Account Setup Needed" message
      return NextResponse.redirect(new URL('/', req.url))
    }

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
    console.error('Middleware auth error:', error)
    if (req.nextUrl.pathname.startsWith('/sign-in')) {
      return NextResponse.next()
    }
    return NextResponse.redirect(new URL('/sign-in', req.url))
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
