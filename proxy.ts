import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/setup',
])

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return NextResponse.next()

  const { userId, sessionClaims } = await auth()

  if (!userId) {
    return NextResponse.redirect(new URL('/sign-in', req.url))
  }

  const role = (sessionClaims?.unsafeMetadata as { role?: string })?.role

  if (!role) {
    if (req.nextUrl.pathname === '/setup') return NextResponse.next()
    return NextResponse.redirect(new URL('/setup', req.url))
  }

  const path = req.nextUrl.pathname

  if (path.startsWith('/admin') && role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/', req.url))
  }

  if (path.startsWith('/teacher') && role !== 'TEACHER') {
    return NextResponse.redirect(new URL('/', req.url))
  }

  if (path.startsWith('/student') && role !== 'STUDENT') {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
