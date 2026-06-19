import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/public(.*)",
  "/api/webhooks(.*)",
  "/unauthorized(.*)",
  "/",
]);

export default clerkMiddleware(async (auth, req) => {
  console.log(
    "[MW]",
    new Date().toISOString(),
    req.method,
    req.nextUrl.pathname,
  );

  if (isPublicRoute(req)) return NextResponse.next();

  const { userId } = await auth();

  // Middleware ONLY checks authentication, never role.
  // Role-based authorization happens in layouts/pages/actions using
  // getCurrentUser() which reads the DB — the single source of truth.
  if (!userId) {
    console.log("[MW] REDIRECT TO SIGN-IN", {
      path: req.nextUrl.pathname,
      hasUserId: !!userId,
    });
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
