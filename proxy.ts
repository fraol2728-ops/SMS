import {
  clerkClient,
  clerkMiddleware,
  createRouteMatcher,
} from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher(["/", "/sign-in(.*)", "/sign-up(.*)"]);

type ClaimsWithRole = {
  metadata?: { role?: string };
  unsafeMetadata?: { role?: string };
};

const getSessionRole = (sessionClaims: unknown) => {
  const claims = sessionClaims as ClaimsWithRole | null | undefined;

  return claims?.metadata?.role || claims?.unsafeMetadata?.role;
};

async function getBackendRole(userId: string) {
  const client = await clerkClient();
  const user = await client.users.getUser(userId);

  return user.publicMetadata?.role as string | undefined;
}

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return NextResponse.next();

  const { userId, sessionClaims } = await auth();

  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  // Try to get role from session claims first (fast path)
  // Clerk exposes publicMetadata under sessionClaims.metadata
  let role = getSessionRole(sessionClaims);

  // Fallback to Clerk Backend API when JWT claims are missing the role.
  // This prevents redirect loops while the JWT template/publicMetadata claim is not configured.
  if (!role) {
    role = await getBackendRole(userId);
  }

  const path = req.nextUrl.pathname;

  // If no role found, allow access to / and redirect to a role-check page
  if (!role) {
    // Allow the request through — the page itself will handle
    // showing appropriate content or redirecting
    // This prevents the redirect loop
    if (path === "/") return NextResponse.next();
    if (path.startsWith("/sign-in") || path.startsWith("/sign-up")) {
      return NextResponse.next();
    }
    // For protected routes with no role, go to home
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (path.startsWith("/admin") && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.url));
  }
  if (path.startsWith("/teacher") && role !== "TEACHER") {
    return NextResponse.redirect(new URL("/", req.url));
  }
  if (path.startsWith("/student") && role !== "STUDENT") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
