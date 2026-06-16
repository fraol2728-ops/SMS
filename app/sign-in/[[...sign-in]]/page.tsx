"use client";

import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Exceed</h1>
          <p className="text-gray-500 mt-2">
            Training Center Management System
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Sign in with the email provided by your administrator
          </p>
        </div>
        <SignIn
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          appearance={{
            elements: {
              footerActionLink: "hidden",
              footerAction: "hidden",
            },
          }}
        />
      </div>
    </div>
  );
}
