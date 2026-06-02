"use client";

import { SignOutButton } from "@clerk/nextjs";
import { ChevronDown, LogOut, Plus, UserPlus } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

const NAV_LINKS = [
  { href: "/super-admin", label: "Overview", exact: true },
  { href: "/super-admin/campuses", label: "Campuses" },
  { href: "/super-admin/admins", label: "Admins" },
  { href: "/super-admin/students", label: "All Students" },
  { href: "/super-admin/teachers", label: "All Teachers" },
  { href: "/super-admin/courses", label: "All Courses" },
  { href: "/super-admin/classes", label: "All Classes" },
  { href: "/super-admin/payments", label: "All Payments" },
  { href: "/super-admin/reports", label: "Reports" },
  { href: "/super-admin/inventory", label: "Inventory" },
  { href: "/super-admin/settings", label: "Settings" },
];

type Campus = { id: string; name: string };

type Admin = { firstName: string; lastName: string };

export function SuperAdminSidebar({
  campuses,
  admin,
}: {
  campuses: Campus[];
  admin: Admin;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultCampusId = searchParams.get("campusId") ?? campuses[0]?.id ?? "all";
  const [selectedCampusId, setSelectedCampusId] = useState(defaultCampusId);
  const [campusDropdownOpen, setCampusDropdownOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  function selectCampus(campusId: string) {
    setSelectedCampusId(campusId);
    setCampusDropdownOpen(false);
    const params = new URLSearchParams(searchParams.toString());
    if (campusId === "all") params.delete("campusId");
    else params.set("campusId", campusId);
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  const selectedCampus = campuses.find((c) => c.id === selectedCampusId);
  const displayName =
    selectedCampusId === "all"
      ? "All Campuses"
      : (selectedCampus?.name ?? "Select Campus");

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-gray-900">
      <div className="flex-shrink-0 border-gray-800 border-b p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600">
              <span className="font-bold text-sm text-white">E</span>
            </div>
            <div>
              <h1 className="font-bold text-white">Exceed</h1>
              <p className="text-gray-400 text-xs">Super Admin</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-gray-400 hover:text-white lg:hidden"
            type="button"
          >
            ×
          </button>
        </div>
      </div>

      <div className="flex-shrink-0 border-gray-800 border-b px-3 py-3">
        <div className="mb-2 flex items-center justify-between gap-3 px-1 text-xs uppercase tracking-[0.24em] text-gray-500">
          <span>CAMPUS</span>
          <div className="flex items-center gap-2">
            <Link
              href="/super-admin/campuses/new"
              className="inline-flex items-center gap-1 rounded-full border border-gray-700 bg-gray-800 px-2.5 py-1 text-[11px] font-semibold text-white transition hover:border-purple-500 hover:text-purple-300"
            >
              <Plus size={12} />
              Add
            </Link>
            <Link
              href="/super-admin/admins/new"
              className="inline-flex items-center gap-1 rounded-full border border-gray-700 bg-gray-800 px-2.5 py-1 text-[11px] font-semibold text-white transition hover:border-cyan-500 hover:text-cyan-300"
            >
              <UserPlus size={12} />
              Admin
            </Link>
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setCampusDropdownOpen(!campusDropdownOpen)}
            className="flex w-full items-center justify-between rounded-xl bg-gray-800 px-3 py-2.5 font-medium text-sm text-white transition-colors hover:bg-gray-700"
            type="button"
          >
            <div className="flex min-w-0 items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${
                  selectedCampusId === "all" ? "bg-purple-500" : "bg-green-500"
                }`}
              />
              <span className="truncate">{displayName}</span>
            </div>
            <ChevronDown
              size={14}
              className={`flex-shrink-0 text-gray-400 transition-transform ${
                campusDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {campusDropdownOpen && (
            <div className="absolute top-full right-0 left-0 z-10 mt-1 overflow-hidden rounded-xl border border-gray-700 bg-gray-800 shadow-xl">
              <button
                onClick={() => selectCampus("all")}
                className={`flex w-full items-center gap-2 px-3 py-2.5 text-sm transition-colors ${
                  selectedCampusId === "all"
                    ? "bg-purple-600 text-white"
                    : "text-gray-300 hover:bg-gray-700"
                }`}
                type="button"
              >
                <div className="h-2 w-2 rounded-full bg-purple-500" />
                All Campuses
              </button>
              {campuses.map((campus) => (
                <button
                  key={campus.id}
                  onClick={() => selectCampus(campus.id)}
                  className={`flex w-full items-center gap-2 px-3 py-2.5 text-sm transition-colors ${
                    selectedCampusId === campus.id
                      ? "bg-purple-600 text-white"
                      : "text-gray-300 hover:bg-gray-700"
                  }`}
                  type="button"
                >
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  {campus.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-shrink-0 border-gray-800 border-b px-3 py-3">
        <div className="flex items-center gap-3 rounded-xl bg-gray-800 p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-500/20 font-bold text-purple-400 text-sm">
            {admin.firstName?.[0]}
            {admin.lastName?.[0]}
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-sm text-white">
              {admin.firstName} {admin.lastName}
            </p>
            <p className="text-gray-400 text-xs">Super Admin</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {NAV_LINKS.map(({ href, label, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={
                selectedCampusId !== "all"
                  ? `${href}?campusId=${selectedCampusId}`
                  : href
              }
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 font-medium text-sm transition-all ${
                active
                  ? "bg-purple-600 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="flex-shrink-0 border-gray-800 border-t p-3">
        <SignOutButton redirectUrl="/sign-in">
          <button
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 font-medium text-gray-400 text-sm transition-all hover:bg-gray-800 hover:text-white"
            type="button"
          >
            <LogOut size={17} />
            Sign Out
          </button>
        </SignOutButton>
      </div>
    </div>
  );

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col lg:flex">
        <SidebarContent />
      </aside>

      {sidebarOpen && (
        <button
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          type="button"
          aria-label="Close navigation"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col transition-transform duration-300 lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent />
      </aside>

      <button
        id="super-sidebar-toggle"
        onClick={() => setSidebarOpen(true)}
        className="hidden"
        type="button"
      />
    </>
  );
}
