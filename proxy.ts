import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/public(.*)',
  '/api/webhooks(.*)',
  '/unauthorized(.*)',
  '/',
])

const isAdminRoute = createRouteMatcher(['/admin(.*)'])
const isSuperAdminRoute = createRouteMatcher(['/super-admin(.*)'])
const isTeacherRoute = createRouteMatcher(['/teacher(.*)'])
const isStudentRoute = createRouteMatcher(['/student(.*)'])

export default clerkMiddleware(async (auth, req) => {
  // Always allow public routes through
  if (isPublicRoute(req)) return NextResponse.next()

  // For all protected routes — check authentication only
  const { userId, sessionClaims } = await auth()

  // Not signed in at all → send to sign in
  if (!userId) {
    return NextResponse.redirect(new URL('/sign-in', req.url))
  }

  // Read role from session claims
  const metadata = sessionClaims?.metadata as Record<string, unknown> | undefined
  const role = metadata?.role as string | undefined

  // CRITICAL FIX:
  // If role is missing from claims DO NOT redirect to /
  // Clerk session claims can be stale on client navigation
  // The layout files handle proper DB-based authorization
  // Just let the request through — layout will handle it
  if (!role) {
    return NextResponse.next()
  }

  // Only block access when role EXISTS but is wrong
  // (not when role is missing — that's handled by layouts)
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
