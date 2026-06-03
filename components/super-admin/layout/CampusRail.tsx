"use client";

import { SignOutButton } from "@clerk/nextjs";
import { Plus, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ExceedCircleLogo } from "@/components/brand/ExceedLogo";

const CAMPUS_COLORS: Record<
  string,
  { bg: string; text: string; ring: string }
> = {
  blue: { bg: "bg-blue-600", text: "text-white", ring: "ring-blue-300" },
  green: { bg: "bg-green-600", text: "text-white", ring: "ring-green-300" },
  purple: { bg: "bg-purple-600", text: "text-white", ring: "ring-purple-300" },
  red: { bg: "bg-red-600", text: "text-white", ring: "ring-red-300" },
  amber: { bg: "bg-amber-500", text: "text-white", ring: "ring-amber-300" },
  rose: { bg: "bg-rose-600", text: "text-white", ring: "ring-rose-300" },
  indigo: { bg: "bg-indigo-600", text: "text-white", ring: "ring-indigo-300" },
  teal: { bg: "bg-teal-600", text: "text-white", ring: "ring-teal-300" },
};

const railCircle =
  "relative flex size-11 shrink-0 items-center justify-center rounded-full aspect-square";

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

function CampusButton({
  campus,
  isSelected,
  onSelect,
}: {
  campus: Campus;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) {
  const colors = CAMPUS_COLORS[campus.color] ?? CAMPUS_COLORS.blue;
  const initials = getCampusInitials(campus.name);

  return (
    <button
      onClick={() => onSelect(campus.id)}
      title={campus.name}
      className={`${railCircle} font-bold text-sm transition-all duration-200 ${colors.bg} ${colors.text} ${
        isSelected
          ? `ring-2 ring-offset-2 ring-offset-gray-900 ${colors.ring}`
          : "opacity-60 hover:opacity-100"
      }`}
      type="button"
    >
      {initials}
      {campus._count.users > 0 ? (
        <span className="absolute -top-0.5 -right-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-red-500 font-bold text-[10px] text-white leading-none">
          {campus._count.users > 99
            ? "99"
            : campus._count.users > 9
              ? "9+"
              : campus._count.users}
        </span>
      ) : null}
    </button>
  );
}

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
    <aside className="fixed top-0 right-0 left-0 z-50 flex h-14 flex-row items-center gap-3 border-gray-800 border-b bg-gray-900 px-3 lg:top-0 lg:right-auto lg:bottom-0 lg:left-0 lg:h-auto lg:w-16 lg:flex-col lg:items-center lg:justify-between lg:gap-0 lg:border-r lg:border-b-0 lg:px-0 lg:py-4">
      <ExceedCircleLogo className="flex-shrink-0" />

      <div className="hidden h-px w-8 shrink-0 bg-gray-700 lg:block" />
      <div className="h-6 w-px shrink-0 bg-gray-700 lg:hidden" />

      {/* Campuses */}
      <div className="flex min-w-0 flex-1 flex-row items-center gap-3 overflow-x-auto lg:w-full lg:flex-1 lg:flex-col lg:justify-start lg:overflow-y-auto lg:px-2 lg:py-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {campuses.map((campus) => (
          <CampusButton
            key={campus.id}
            campus={campus}
            isSelected={campus.id === selectedCampusId}
            onSelect={onSelect}
          />
        ))}
      </div>

      <div className="hidden h-px w-8 shrink-0 bg-gray-700 lg:block" />
      <div className="h-6 w-px shrink-0 bg-gray-700 lg:hidden" />

      {/* Actions */}
      <div className="relative flex shrink-0 flex-row items-center gap-3 lg:flex-col">
        <button
          onClick={() => setShowPlusMenu(!showPlusMenu)}
          title="Add campus or admin"
          className={`${railCircle} bg-gray-700 text-gray-300 transition-colors hover:bg-gray-600 hover:text-white`}
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
            <div className="absolute top-full right-0 z-50 mt-2 min-w-[180px] overflow-hidden rounded-xl border border-gray-700 bg-gray-800 shadow-xl lg:top-auto lg:right-auto lg:bottom-0 lg:left-14 lg:mt-0">
              <Link
                href="/super-admin/campuses/new"
                onClick={() => setShowPlusMenu(false)}
                className="flex items-center gap-3 px-4 py-3 text-gray-300 text-sm transition-colors hover:bg-gray-700 hover:text-white"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-600">
                  <span className="font-bold text-white text-xs">C+</span>
                </div>
                Add Campus
              </Link>
              <Link
                href="/super-admin/admins/new"
                onClick={() => setShowPlusMenu(false)}
                className="flex items-center gap-3 border-gray-700 border-t px-4 py-3 text-gray-300 text-sm transition-colors hover:bg-gray-700 hover:text-white"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-green-600">
                  <span className="font-bold text-white text-xs">A+</span>
                </div>
                Add Admin
              </Link>
            </div>
          </>
        ) : null}

        <Link
          href="/super-admin/settings"
          title="Settings"
          className="shrink-0"
        >
          <button
            className={`${railCircle} transition-colors ${
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
            className={`${railCircle} bg-purple-800 font-bold text-sm text-white transition-colors hover:bg-purple-700`}
            type="button"
          >
            {admin.firstName?.[0]}
            {admin.lastName?.[0]}
          </button>
        </SignOutButton>
      </div>
    </aside>
  );
}
