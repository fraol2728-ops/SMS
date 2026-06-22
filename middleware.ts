import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/unauthorized",
  "/api/public(.*)",
  "/api/webhooks(.*)",
  "/api/cron(.*)",
  "/api/check-email",
  "/api/auth/sync-user",
]);

const isProtectedRoute = createRouteMatcher([
  "/admin(.*)",
  "/super-admin(.*)",
  "/teacher(.*)",
  "/student(.*)",
  "/api/admin(.*)",
  "/api/export(.*)",
  "/api/backup(.*)",
  "/api/sync-clerk-ids",
  "/api/search",
  "/api/reports(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req) || !isProtectedRoute(req)) {
    return;
  }

  const { userId, redirectToSignIn } = await auth();
  if (!userId) {
    return redirectToSignIn({ returnBackUrl: req.url });
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files, unless found in search params.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes.
    "/(api|trpc)(.*)",
  ],
};
