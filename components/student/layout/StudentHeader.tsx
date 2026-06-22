"use client";

import { UserButton } from "@clerk/nextjs";
import { Bell, Menu } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export function StudentHeader({
  user,
  unreadCount,
  onMenuClick,
}: {
  user: { firstName?: string | null };
  unreadCount: number;
  onMenuClick: () => void;
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
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-100 bg-white/80 px-4 backdrop-blur-sm sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-xl p-2 transition-colors hover:bg-gray-100 lg:hidden"
        >
          <Menu size={20} className="text-gray-600" />
        </button>
        <div className="hidden sm:block">
          <p className="text-sm font-semibold text-gray-900">
            {mounted && currentDate ? `${greeting}, ${user.firstName} 👋` : ""}
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
      <div className="flex items-center gap-2 sm:gap-3">
        <Link href="/student/notifications">
          <button
            type="button"
            className="relative rounded-xl p-2 transition-colors hover:bg-gray-100"
          >
            <Bell size={20} className="text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold leading-none text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        </Link>
        <UserButton />
      </div>
    </header>
  );
}
