import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/unauthorized",
  "/api/webhooks(.*)",
  "/api/cron(.*)",
]);

// Define which paths each role can access
const ROLE_ALLOWED_PATHS: Record<string, string[]> = {
  SUPER_ADMIN: ["/super-admin", "/admin", "/api"],
  ADMIN: ["/admin", "/api"],
  TEACHER: ["/teacher", "/api"],
  STUDENT: ["/student", "/api"],
};

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
    return NextResponse.redirect(
      new URL("/unauthorized?reason=no-role", req.url),
    );
  }

  const allowedPaths = ROLE_ALLOWED_PATHS[role] ?? [];
  const isAllowed = allowedPaths.some((p) => path.startsWith(p));

  if (!isAllowed) {
    // Redirect each role to their home
    const roleHome: Record<string, string> = {
      SUPER_ADMIN: "/super-admin",
      ADMIN: "/admin",
      TEACHER: "/teacher",
      STUDENT: "/student",
    };
    return NextResponse.redirect(
      new URL(roleHome[role] ?? "/unauthorized", req.url),
    );
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
