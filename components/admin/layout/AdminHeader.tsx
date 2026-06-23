"use client";

import { UserButton } from "@clerk/nextjs";
import { Bell, Menu, Settings } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { GlobalSearch } from "@/components/shared/GlobalSearch";
import { SettingsModal } from "../settings/SettingsModal";

type AdminLayoutUser = {
  firstName: string;
  lastName: string;
  role: string;
  campusId?: string | null;
  campus?: { name: string } | null;
};

export function AdminHeader({
  user,
  onMenuClick,
  settings,
}: {
  user: AdminLayoutUser;
  onMenuClick?: () => void;
  settings: any;
}) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  function openSidebar() {
    if (onMenuClick) onMenuClick();
    else document.getElementById("sidebar-toggle")?.click();
  }

  const now = new Date();

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 flex-shrink-0 items-center justify-between gap-3 border-b bg-white/80 px-4 shadow-sm backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/80 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            aria-label="Open navigation"
            className="rounded-xl p-2 transition-all duration-200 hover:scale-105 hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden"
            onClick={openSidebar}
            type="button"
          >
            <Menu className="text-gray-600 dark:text-gray-300" size={20} />
          </button>
          <div className="hidden sm:block">
            <p className="text-xs text-gray-400 dark:text-gray-500">
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
          <GlobalSearch portal="admin" campusId={user.campusId ?? undefined} />
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <Link href="/admin/notifications">
            <button
              className="relative rounded-xl p-2 transition-all duration-200 hover:scale-105 hover:bg-gray-100 dark:hover:bg-gray-800"
              type="button"
            >
              <Bell className="text-gray-600 dark:text-gray-300" size={20} />
            </button>
          </Link>
          <button
            className="rounded-xl p-2 transition-all duration-200 hover:scale-105 hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={() => setSettingsOpen(true)}
            title="Settings"
            type="button"
          >
            <Settings className="text-gray-600 dark:text-gray-300" size={20} />
          </button>
          <div className="hidden items-center gap-2 text-sm text-gray-600 dark:text-gray-300 sm:flex">
            <p className="font-medium">
              {user.firstName} {user.lastName}
            </p>
          </div>
          <UserButton />
        </div>
      </header>
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
      />
    </>
  );
}
