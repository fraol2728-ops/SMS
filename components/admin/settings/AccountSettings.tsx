"use client";

import { SignOutButton } from "@clerk/nextjs";
import { Key, LogOut, Shield } from "lucide-react";
import type { AdminUserData } from "./types";

export function AccountSettings({ user }: { user: AdminUserData }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-white p-4 sm:p-6">
        <h2 className="mb-1 text-lg font-semibold text-gray-900">
          Account & Security
        </h2>
        <p className="mb-6 text-sm text-gray-500">
          Manage your account security
        </p>
        <div className="space-y-3">
          <div className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                <Shield className="text-blue-600" size={18} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Clerk Account
                </p>
                <p className="text-xs text-gray-400">{user.email}</p>
              </div>
            </div>
            <a
              className="text-sm font-medium text-blue-600 hover:text-blue-800"
              href="https://accounts.clerk.dev/user"
              rel="noopener noreferrer"
              target="_blank"
            >
              Manage →
            </a>
          </div>
          <div className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
                <Key className="text-green-600" size={18} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Change Password
                </p>
                <p className="text-xs text-gray-400">
                  Update via Clerk account portal
                </p>
              </div>
            </div>
            <a
              className="text-sm font-medium text-blue-600 hover:text-blue-800"
              href="https://accounts.clerk.dev/user/security"
              rel="noopener noreferrer"
              target="_blank"
            >
              Change →
            </a>
          </div>
          <div className="flex flex-col gap-3 rounded-xl border border-red-100 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100">
                <LogOut className="text-red-600" size={18} />
              </div>
              <div>
                <p className="text-sm font-medium text-red-700">Sign Out</p>
                <p className="text-xs text-red-400">Sign out of your account</p>
              </div>
            </div>
            <SignOutButton redirectUrl="/sign-in">
              <button
                className="text-sm font-medium text-red-600 hover:text-red-800"
                type="button"
              >
                Sign out →
              </button>
            </SignOutButton>
          </div>
        </div>
      </div>
    </div>
  );
}
