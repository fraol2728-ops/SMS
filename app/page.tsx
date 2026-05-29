import { SignInButton } from "@clerk/nextjs";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { userId } = await auth();

  if (!userId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-gray-50">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Exceed</h1>
          <p className="text-gray-500 mb-8">
            Training Center Management System
          </p>
          <SignInButton mode="modal">
            <button
              type="button"
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Sign In
            </button>
          </SignInButton>
        </div>
      </div>
    );
  }

  // Get full user to read publicMetadata
  const user = await currentUser();
  const role = user?.publicMetadata?.role as string | undefined;

  if (role === "ADMIN") redirect("/admin");
  if (role === "TEACHER") redirect("/teacher");
  if (role === "STUDENT") redirect("/student");

  // Signed in but no role set
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-bold">Welcome to Exceed</h1>
      <p className="text-gray-500">Your account has no role assigned yet.</p>
      <p className="text-sm text-gray-400">
        Please contact your administrator to get access.
      </p>
    </div>
  );
}
