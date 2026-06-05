"use client";

import { UserButton } from "@clerk/nextjs";
import { Bell, Menu } from "lucide-react";
import { SuperAdminSearchWrapper } from "./SuperAdminSearchWrapper";

type Campus = { id: string; name: string; color: string };
type Admin = { firstName: string; lastName: string };

const CAMPUS_COLORS: Record<string, string> = {
  blue: "text-blue-600",
  green: "text-green-600",
  purple: "text-purple-600",
  red: "text-red-600",
  amber: "text-amber-600",
  rose: "text-rose-600",
  indigo: "text-indigo-600",
  teal: "text-teal-600",
};

export function SuperAdminHeader({
  campus,
  admin,
  onMenuClick,
}: {
  campus: Campus | undefined;
  admin: Admin;
  onMenuClick: () => void;
}) {
  const now = new Date();

  return (
    <header className="sticky top-14 z-20 flex h-16 flex-shrink-0 items-center gap-3 border-gray-200 border-b bg-white px-4 dark:border-gray-700 dark:bg-gray-900 sm:px-6 lg:top-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden"
          type="button"
        >
          <Menu size={20} className="text-gray-600 dark:text-gray-300" />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <h2
              className={`font-bold text-sm sm:text-base ${CAMPUS_COLORS[campus?.color ?? "blue"] ?? "text-blue-600"}`}
            >
              {campus?.name ?? "Super Admin"}
            </h2>
            <span className="hidden rounded-full bg-gray-100 px-2 py-0.5 text-gray-400 text-xs dark:bg-gray-800 sm:inline">
              Super Admin View
            </span>
          </div>
          <p className="mt-0.5 hidden text-gray-400 text-xs sm:block">
            {now.toLocaleDateString("en-GB", {
              weekday: "long",
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      <div className="max-w-sm flex-1">
        <SuperAdminSearchWrapper />
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <button
          className="relative rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
          type="button"
        >
          <Bell size={20} className="text-gray-600 dark:text-gray-300" />
        </button>
        <div className="hidden items-center gap-2 sm:flex">
          <div className="text-right">
            <p className="font-medium text-gray-900 text-sm leading-none dark:text-white">
              {admin.firstName} {admin.lastName}
            </p>
            <p className="mt-0.5 text-purple-600 text-xs dark:text-purple-400">
              Super Admin
            </p>
          </div>
        </div>
        <UserButton />
      </div>
    </header>
  );
}
