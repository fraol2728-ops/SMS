"use client";

import { UserButton } from "@clerk/nextjs";
import { Bell, Menu } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { GlobalSearch } from "@/components/shared/GlobalSearch";

export function TeacherHeader({
  teacher,
  onMenuClick,
}: {
  teacher: any;
  onMenuClick?: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [currentDate, setCurrentDate] = useState<Date | null>(null);

  useEffect(() => {
    setMounted(true);
    setCurrentDate(new Date());
  }, []);

  const hour = currentDate?.getHours();
  const greeting =
    hour == null
      ? ""
      : hour < 12
        ? "Good morning"
        : hour < 17
          ? "Good afternoon"
          : "Good evening";

  return (
    <header className="sticky top-0 z-30 flex h-16 flex-shrink-0 items-center gap-3 border-b bg-white px-4 dark:border-gray-700 dark:bg-gray-900 sm:px-6">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
            if (onMenuClick) onMenuClick();
            else document.getElementById("teacher-sidebar-toggle")?.click();
          }}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <Menu size={20} className="text-gray-600 dark:text-gray-300" />
        </button>
        <div className="hidden sm:block">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {mounted && currentDate ? `${greeting}, ${teacher.firstName}` : ""}
          </p>
          <p className="text-xs text-gray-400">
            {mounted && currentDate
              ? currentDate.toLocaleDateString("en-GB", {
                  weekday: "long",
                  day: "2-digit",
                  month: "long",
                })
              : ""}
          </p>
        </div>
      </div>

      <div className="hidden max-w-xs flex-1 sm:block">
        <GlobalSearch portal="teacher" />
      </div>

      {/* Right */}
      <div className="ml-auto flex items-center gap-2 sm:gap-3">
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
