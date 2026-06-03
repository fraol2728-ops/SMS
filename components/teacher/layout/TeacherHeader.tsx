"use client";

import { UserButton } from "@clerk/nextjs";
import { Bell, Menu } from "lucide-react";
import Link from "next/link";

export function TeacherHeader({ teacher }: { teacher: any }) {
  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <header className="h-16 bg-white dark:bg-gray-900 border-b dark:border-gray-700 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 flex-shrink-0">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() =>
            document.getElementById("teacher-sidebar-toggle")?.click()
          }
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <Menu size={20} className="text-gray-600 dark:text-gray-300" />
        </button>
        <div className="hidden sm:block">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {greeting}, {teacher.firstName}
          </p>
          <p className="text-xs text-gray-400">
            {now.toLocaleDateString("en-GB", {
              weekday: "long",
              day: "2-digit",
              month: "long",
            })}
          </p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 sm:gap-3">
        <Link href="/teacher/mail">
          <button
            type="button"
            className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Bell size={20} className="text-gray-600 dark:text-gray-300" />
          </button>
        </Link>
        <UserButton />
      </div>
    </header>
  );
}
