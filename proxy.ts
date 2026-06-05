// ============================================================
// IMPORTANT: Clerk Dashboard Setup Required
// Configure → Sessions → Customize session token
// Must be set to: { "metadata": "{{user.public_metadata}}" }
// Without this, roles will not appear in session claims
// ============================================================

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/unauthorized(.*)",
  "/api/webhooks(.*)",
  "/api/cron(.*)",
  "/api/sync-clerk-ids(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return NextResponse.next();

  const { userId, sessionClaims } = await auth();
  const path = req.nextUrl.pathname;

  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  const claims = sessionClaims as {
    metadata?: { role?: string };
    publicMetadata?: { role?: string };
    public_metadata?: { role?: string };
    unsafeMetadata?: { role?: string };
  };

  // Try multiple locations where Clerk might put the role
  const role =
    claims?.metadata?.role ||
    claims?.publicMetadata?.role ||
    claims?.public_metadata?.role ||
    claims?.unsafeMetadata?.role ||
    null;

  if (!role) {
    if (path === "/unauthorized") return NextResponse.next();
    return NextResponse.redirect(
      new URL("/unauthorized?reason=no-role", req.url),
    );
  }

  // SUPER_ADMIN can access everything
  if (role === "SUPER_ADMIN") {
    return NextResponse.next();
  }

  // ADMIN
  if (role === "ADMIN") {
    if (path.startsWith("/admin") || path.startsWith("/api")) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  // TEACHER
  if (role === "TEACHER") {
    if (path.startsWith("/teacher") || path.startsWith("/api")) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/teacher", req.url));
  }

  // STUDENT
  if (role === "STUDENT") {
    if (path.startsWith("/student") || path.startsWith("/api")) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/student", req.url));
  }

  return NextResponse.redirect(new URL("/unauthorized", req.url));
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
