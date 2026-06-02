"use client";

import { SignOutButton } from "@clerk/nextjs";
import { Plus, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const CAMPUS_COLORS: Record<
  string,
  { bg: string; selected: string; text: string; ring: string }
> = {
  blue: {
    bg: "bg-blue-600",
    selected: "bg-blue-500",
    text: "text-white",
    ring: "ring-blue-300",
  },
  green: {
    bg: "bg-green-600",
    selected: "bg-green-500",
    text: "text-white",
    ring: "ring-green-300",
  },
  purple: {
    bg: "bg-purple-600",
    selected: "bg-purple-500",
    text: "text-white",
    ring: "ring-purple-300",
  },
  red: {
    bg: "bg-red-600",
    selected: "bg-red-500",
    text: "text-white",
    ring: "ring-red-300",
  },
  amber: {
    bg: "bg-amber-500",
    selected: "bg-amber-400",
    text: "text-white",
    ring: "ring-amber-300",
  },
  rose: {
    bg: "bg-rose-600",
    selected: "bg-rose-500",
    text: "text-white",
    ring: "ring-rose-300",
  },
  indigo: {
    bg: "bg-indigo-600",
    selected: "bg-indigo-500",
    text: "text-white",
    ring: "ring-indigo-300",
  },
  teal: {
    bg: "bg-teal-600",
    selected: "bg-teal-500",
    text: "text-white",
    ring: "ring-teal-300",
  },
};

function getCampusInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

type Campus = {
  id: string;
  name: string;
  color: string;
  _count: { users: number };
};
type Admin = { firstName: string; lastName: string };

export function CampusRail({
  campuses,
  selectedCampusId,
  onSelect,
  admin,
}: {
  campuses: Campus[];
  selectedCampusId: string;
  onSelect: (id: string) => void;
  admin: Admin;
}) {
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const pathname = usePathname();

  return (
    <aside className="fixed top-0 bottom-0 left-0 z-50 flex w-16 flex-col items-center gap-2 border-gray-800 border-r bg-gray-900 py-3">
      <div className="mb-2 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-purple-600">
        <span className="font-black text-sm text-white">E</span>
      </div>

      <div className="mb-1 h-px w-8 bg-gray-700" />

      <div className="flex w-full flex-1 flex-col items-center gap-2 overflow-y-auto px-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {campuses.map((campus) => {
          const isSelected = campus.id === selectedCampusId;
          const colors = CAMPUS_COLORS[campus.color] ?? CAMPUS_COLORS.blue;
          const initials = getCampusInitials(campus.name);

          return (
            <button
              key={campus.id}
              onClick={() => onSelect(campus.id)}
              title={campus.name}
              className={`relative flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl font-bold text-sm transition-all duration-200 ${colors.bg} ${colors.text} ${
                isSelected
                  ? `scale-105 rounded-xl ring-2 ring-offset-2 ring-offset-gray-900 ${colors.ring}`
                  : "opacity-60 hover:rounded-xl hover:opacity-100"
              }`}
              type="button"
            >
              {initials}
              {campus._count.users > 0 ? (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 font-bold text-white text-xs leading-none">
                  {campus._count.users > 99
                    ? "99"
                    : campus._count.users > 9
                      ? "9+"
                      : campus._count.users}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="mt-1 h-px w-8 bg-gray-700" />

      <div className="relative flex-shrink-0">
        <button
          onClick={() => setShowPlusMenu(!showPlusMenu)}
          title="Add campus or admin"
          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-700 text-gray-300 transition-all hover:bg-gray-600 hover:text-white"
          type="button"
        >
          <Plus size={20} />
        </button>

        {showPlusMenu ? (
          <>
            <button
              aria-label="Close add menu"
              className="fixed inset-0 z-40"
              onClick={() => setShowPlusMenu(false)}
              type="button"
            />
            <div className="absolute bottom-0 left-14 z-50 min-w-[180px] overflow-hidden rounded-xl border border-gray-700 bg-gray-800 shadow-xl">
              <Link
                href="/super-admin/campuses/new"
                onClick={() => setShowPlusMenu(false)}
                className="flex items-center gap-3 px-4 py-3 text-gray-300 text-sm transition-colors hover:bg-gray-700 hover:text-white"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                  <span className="font-bold text-white text-xs">C+</span>
                </div>
                Add Campus
              </Link>
              <Link
                href="/super-admin/admins/new"
                onClick={() => setShowPlusMenu(false)}
                className="flex items-center gap-3 border-gray-700 border-t px-4 py-3 text-gray-300 text-sm transition-colors hover:bg-gray-700 hover:text-white"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-600">
                  <span className="font-bold text-white text-xs">A+</span>
                </div>
                Add Admin
              </Link>
            </div>
          </>
        ) : null}
      </div>

      <Link
        href="/super-admin/settings"
        title="Settings"
        className="flex-shrink-0"
      >
        <button
          className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-all ${
            pathname.startsWith("/super-admin/settings")
              ? "bg-purple-600 text-white"
              : "text-gray-400 hover:bg-gray-700 hover:text-white"
          }`}
          type="button"
        >
          <Settings size={18} />
        </button>
      </Link>

      <SignOutButton redirectUrl="/sign-in">
        <button
          title={`${admin.firstName} ${admin.lastName} — Sign out`}
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-purple-800 font-bold text-sm text-white transition-all hover:bg-purple-700"
          type="button"
        >
          {admin.firstName?.[0]}
          {admin.lastName?.[0]}
        </button>
      </SignOutButton>
    </aside>
  );
}
