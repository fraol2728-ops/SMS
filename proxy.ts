import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/unauthorized",
  "/api/webhooks(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return NextResponse.next();

  const { userId, sessionClaims } = await auth();

  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  const metadata = sessionClaims?.metadata as
    | {
        role?: string;
        campusId?: string;
      }
    | undefined;

  const role = metadata?.role;
  const path = req.nextUrl.pathname;

  if (!role) {
    if (path === "/unauthorized") return NextResponse.next();
    // No role in session — could be fresh signup, send to unauthorized
    // with a message to sign out and sign in again
    return NextResponse.redirect(
      new URL("/unauthorized?reason=no-role", req.url),
    );
  }

  // SUPER_ADMIN can access everything except student/teacher portals
  if (role === "SUPER_ADMIN") {
    if (path.startsWith("/student") || path.startsWith("/teacher")) {
      return NextResponse.redirect(new URL("/super-admin", req.url));
    }
    return NextResponse.next();
  }

  if (path.startsWith("/super-admin") && role !== "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }
  if (path.startsWith("/admin") && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }
  if (path.startsWith("/teacher") && role !== "TEACHER") {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }
  if (path.startsWith("/student") && role !== "STUDENT") {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
