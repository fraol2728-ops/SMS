import { redirect } from "next/navigation";
import { HomeClient } from "@/components/home/HomeClient";
import { getCurrentUser } from "@/lib/auth/current-user";

export default async function HomePage() {
  const user = await getCurrentUser();

  if (!user) {
    return <HomeClient />;
  }

  if (user.role === "SUPER_ADMIN") {
    console.log("[LAYOUT:app/page]", {
      reason: "role-redirect-super-admin",
      userId: user.id,
      clerkId: user.clerkId,
      role: user.role,
      pathname: "/",
      timestamp: new Date().toISOString(),
    });
    redirect("/super-admin");
  }
  if (user.role === "ADMIN") {
    console.log("[LAYOUT:app/page]", {
      reason: "role-redirect-admin",
      userId: user.id,
      clerkId: user.clerkId,
      role: user.role,
      pathname: "/",
      timestamp: new Date().toISOString(),
    });
    redirect("/admin");
  }
  if (user.role === "TEACHER") {
    console.log("[LAYOUT:app/page]", {
      reason: "role-redirect-teacher",
      userId: user.id,
      clerkId: user.clerkId,
      role: user.role,
      pathname: "/",
      timestamp: new Date().toISOString(),
    });
    redirect("/teacher");
  }
  if (user.role === "STUDENT") {
    console.log("[LAYOUT:app/page]", {
      reason: "role-redirect-student",
      userId: user.id,
      clerkId: user.clerkId,
      role: user.role,
      pathname: "/",
      timestamp: new Date().toISOString(),
    });
    redirect("/student");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8 max-w-md">
        <p className="text-5xl mb-4">⚙️</p>
        <h1 className="text-xl font-bold text-gray-900 mb-2">
          Account Setup Required
        </h1>
        <p className="text-gray-500 text-sm mb-4">
          Your account exists but your role has not been assigned yet. Please
          contact your administrator.
        </p>
        <a
          href="/sign-in"
          className="mt-4 inline-block text-sm text-blue-600 hover:text-blue-800"
        >
          Sign in with a different account
        </a>
      </div>
    </div>
  );
}
