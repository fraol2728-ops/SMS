import { SignOutButton } from "@clerk/nextjs";
import Link from "next/link";

export default function UnauthorizedPage({
  searchParams,
}: {
  searchParams?: { reason?: string };
}) {
  const isNoRole = searchParams?.reason === "no-role";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-gray-50">
      <div className="text-center max-w-md p-8 bg-white rounded-2xl shadow-sm border">
        <div className="text-6xl mb-4">🚫</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Access Not Authorized
        </h1>

        {isNoRole ? (
          <>
            <p className="text-gray-500 mb-4">
              Your account was created but your role has not been activated yet.
              This can happen right after accepting an invitation.
            </p>
            <p className="text-gray-500 mb-6 font-medium">
              Please sign out and sign back in to activate your access.
            </p>
          </>
        ) : (
          <>
            <p className="text-gray-500 mb-2">
              Your account does not have access to this system.
            </p>
            <p className="text-gray-500 mb-6">
              If you are a student or teacher at Exceed Training Center, please
              make sure you are signing in with the exact email address provided
              to you by your administrator.
            </p>
          </>
        )}

        <div className="flex flex-col gap-3">
          <SignOutButton redirectUrl="/sign-in">
            <button
              type="button"
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Sign out and sign in again
            </button>
          </SignOutButton>
          <Link
            href="/sign-in"
            className="w-full px-6 py-2 border rounded-lg hover:bg-gray-50 text-center text-sm"
          >
            Sign in with different account
          </Link>
        </div>
      </div>
    </div>
  );
}
