"use client";

import { UserButton } from "@clerk/nextjs";
import { Bell, Menu } from "lucide-react";
import Link from "next/link";

type AdminLayoutUser = {
  firstName: string;
  lastName: string;
  role: string;
  campus?: { name: string } | null;
};

export function AdminHeader({ user }: { user: AdminLayoutUser }) {
  function openSidebar() {
    document.getElementById("sidebar-toggle")?.click();
  }

  const now = new Date();

  return (
    <header className="sticky top-0 z-30 flex h-16 flex-shrink-0 items-center justify-between border-b bg-white px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          aria-label="Open navigation"
          className="rounded-lg p-2 transition-colors hover:bg-gray-100 lg:hidden"
          onClick={openSidebar}
          type="button"
        >
          <Menu className="text-gray-600" size={20} />
        </button>
        <div className="hidden sm:block">
          <p className="text-xs text-gray-400">
            {now.toLocaleDateString("en-GB", {
              weekday: "long",
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <Link href="/admin/notifications">
          <button
            className="relative rounded-lg p-2 transition-colors hover:bg-gray-100"
            type="button"
          >
            <Bell className="text-gray-600" size={20} />
          </button>
        </Link>
        <Link href="/admin/settings">
          <div className="hidden items-center gap-2 text-sm text-gray-600 transition-colors hover:text-gray-900 sm:flex">
            <p className="font-medium">
              {user.firstName} {user.lastName}
            </p>
          </div>
        </Link>
        <UserButton />
      </div>
    </header>
  );
}
