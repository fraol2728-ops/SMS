"use client";

import { SignOutButton } from "@clerk/nextjs";
import {
  BookOpen,
  CheckSquare,
  ChevronRight,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  LogOut,
  Mail,
  Package,
  User,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const NAV_LINKS = [
  { href: "/teacher", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/teacher/classes", label: "My Classes", icon: BookOpen },
  { href: "/teacher/attendance", label: "Attendance", icon: ClipboardCheck },
  { href: "/teacher/students", label: "My Students", icon: Users },
  { href: "/teacher/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/teacher/mail", label: "Mail", icon: Mail },
  { href: "/teacher/reports", label: "Reports", icon: FileText },
  { href: "/teacher/inventory", label: "Inventory", icon: Package },
  { href: "/teacher/profile", label: "My Profile", icon: User },
];

export function TeacherSidebar({
  teacher,
  classes,
}: {
  teacher: any;
  classes: any[];
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: close the mobile drawer whenever the active route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  const SidebarContent = () => (
    <div className="bg-gray-900 flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-gray-800 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">E</span>
          </div>
          <div>
            <h1 className="text-white font-bold leading-none">Exceed</h1>
            <p className="text-gray-400 text-xs mt-0.5">Teacher Portal</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="lg:hidden text-gray-400 hover:text-white p-1 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Teacher Info */}
      <div className="px-4 py-3 border-b border-gray-800 flex-shrink-0">
        <div className="bg-gray-800 rounded-xl p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-sm flex-shrink-0">
            {teacher.firstName?.[0]}
            {teacher.lastName?.[0]}
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">
              {teacher.firstName} {teacher.lastName}
            </p>
            <p className="text-gray-400 text-xs truncate">
              {teacher.teacherProfile?.teacherCode}
            </p>
          </div>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <div className="bg-gray-800 rounded-lg px-3 py-2">
            <p className="text-gray-400 text-xs">Classes</p>
            <p className="text-white font-semibold text-sm">{classes.length}</p>
          </div>
          <div className="bg-gray-800 rounded-lg px-3 py-2">
            <p className="text-gray-400 text-xs">Students</p>
            <p className="text-white font-semibold text-sm">
              {classes.reduce(
                (sum, c) => sum + (c._count?.enrollments ?? 0),
                0,
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation — scrollable, hidden scrollbar */}
      <nav
        className="flex-1 p-3 space-y-0.5 overflow-y-auto
        [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {NAV_LINKS.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              <Icon size={17} className="flex-shrink-0" />
              <span className="truncate">{label}</span>
              {active && (
                <ChevronRight
                  size={13}
                  className="ml-auto opacity-70 flex-shrink-0"
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Sign Out */}
      <div className="p-3 border-t border-gray-800 flex-shrink-0">
        <SignOutButton redirectUrl="/sign-in">
          <button
            type="button"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 w-full transition-all"
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
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-64 z-40">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {open && (
        <button
          type="button"
          aria-label="Close teacher sidebar"
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 w-72 z-50 flex flex-col lg:hidden transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Hidden trigger for header */}
      <button
        type="button"
        id="teacher-sidebar-toggle"
        onClick={() => setOpen(true)}
        className="sr-only"
      />
    </>
  );
}
