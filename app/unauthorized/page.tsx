import { SignOutButton } from "@clerk/nextjs";
import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-gray-50">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">🚫</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Access Not Authorized
        </h1>
        <p className="text-gray-500 mb-2">
          Your account does not have access to this system.
        </p>
        <p className="text-gray-500 mb-8">
          If you are a student or teacher at Exceed Training Center, please make
          sure you are signing in with the exact email address provided to you
          by your administrator.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/sign-in"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Sign in with different account
          </Link>
          <SignOutButton>
            <button
              type="button"
              className="px-6 py-2 border rounded-lg hover:bg-gray-100"
            >
              Sign out
            </button>
          </SignOutButton>
        </div>
      </div>
    </div>
  );
}
