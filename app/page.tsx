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
          <p className="text-gray-500 mb-2">
            Training Center Management System
          </p>
          <p className="text-sm text-gray-400 mb-8">
            Sign in with the email provided by your administrator
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

  const user = await currentUser();
  const role = user?.publicMetadata?.role as string | undefined;

  if (role === "ADMIN") redirect("/admin");
  if (role === "TEACHER") redirect("/teacher");
  if (role === "STUDENT") redirect("/student");

  redirect("/unauthorized");
}
