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

  const { userId, sessionClaims } = await auth()

  // Not logged in — redirect to sign in
  if (!userId) {
    return NextResponse.redirect(new URL('/sign-in', req.url))
  }

  const role = (sessionClaims?.metadata as any)?.role as string | undefined

  // If no role yet — don't redirect to sign-in (would cause loop)
  // Instead redirect to unauthorized
  if (!role) {
    if (req.nextUrl.pathname !== '/unauthorized') {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }
    return NextResponse.next()
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
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
