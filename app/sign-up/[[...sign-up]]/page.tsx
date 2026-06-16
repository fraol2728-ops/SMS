import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Exceed</h1>
          <p className="text-gray-500 mt-2">
            Training Center Management System
          </p>
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-800 font-medium">
              🔒 Invitation Only
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Only pre-registered emails can create an account. Contact your
              administrator if you need access.
            </p>
          </div>
        </div>
        <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" />
      </div>
    </div>
  );
}
