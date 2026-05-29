import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/unauthorized",
  "/api/webhooks/clerk(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return NextResponse.next();

  const { userId } = await auth();

  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  const { sessionClaims } = await auth();
  const metadata = sessionClaims?.metadata as { role?: string } | undefined;
  const role = metadata?.role;

  const path = req.nextUrl.pathname;

  if (!role) {
    if (path === "/unauthorized") return NextResponse.next();
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
