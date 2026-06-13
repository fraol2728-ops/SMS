import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { HomeClient } from "@/components/home/HomeClient";

export default async function HomePage() {
  const { userId, sessionClaims } = await auth();

  if (userId) {
    // Read role directly from sessionClaims
    const role = (sessionClaims?.metadata as any)?.role as string | undefined;

    if (role === "SUPER_ADMIN") redirect("/super-admin");
    if (role === "ADMIN") redirect("/admin");
    if (role === "TEACHER") redirect("/teacher");
    if (role === "STUDENT") redirect("/student");

    // Role is missing from session token
    // DO NOT redirect to /unauthorized — that causes loop
    // Instead show a helpful message
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4 p-8 max-w-md">
          <p className="text-6xl">⚙️</p>
          <h1 className="text-xl font-black text-gray-900">
            Account Setup Required
          </h1>
          <p className="text-gray-500 text-sm">
            Your account exists but your role has not been assigned yet.
            Please contact your administrator.
          </p>
          <p className="text-xs text-gray-400">
            User ID: {userId}
          </p>
        </div>
      </div>
    );
  }

  return <HomeClient />;
}
