"use client";

import { SignOutButton } from "@clerk/nextjs";
import {
  BookOpen,
  CalendarDays,
  CheckSquare,
  ClipboardCheck,
  FileText,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  Mail,
  Package,
  TrendingUp,
  User,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/teacher", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/teacher/classes", label: "My Classes", icon: BookOpen },
  { href: "/teacher/attendance", label: "Attendance", icon: ClipboardCheck },
  { href: "/teacher/students", label: "My Students", icon: Users },
  { href: "/teacher/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/teacher/mail", label: "Mail", icon: Mail },
  { href: "/teacher/events", label: "Events", icon: CalendarDays },
  { href: "/teacher/reports", label: "Reports", icon: FileText },
  { href: "/teacher/materials", label: "Materials", icon: FolderOpen },
  { href: "/teacher/inventory", label: "Inventory", icon: Package },
  { href: "/teacher/performance", label: "My Performance", icon: TrendingUp },
  { href: "/teacher/profile", label: "My Profile", icon: User },
];

export function TeacherSidebar({
  teacher,
  classes,
  collapsed = false,
}: {
  teacher: any;
  classes: any[];
  collapsed?: boolean;
}) {
  const pathname = usePathname();

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <div className="bg-gray-900 flex flex-col h-full">
      <div className="px-3 py-3 border-b border-gray-800 flex-shrink-0">
        <div
          className={`bg-gray-800 rounded-xl p-3 flex items-center ${collapsed ? "justify-center" : "gap-3"}`}
          title={
            collapsed ? `${teacher.firstName} ${teacher.lastName}` : undefined
          }
        >
          <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-sm flex-shrink-0">
            {teacher.firstName?.[0]}
            {teacher.lastName?.[0]}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">
                {teacher.firstName} {teacher.lastName}
              </p>
              <p className="text-gray-400 text-xs truncate">
                {teacher.teacherProfile?.teacherCode}
              </p>
            </div>
          )}
        </div>
        {!collapsed && (
          <div className="mt-2 grid grid-cols-2 gap-2">
            <div className="bg-gray-800 rounded-lg px-3 py-2">
              <p className="text-gray-400 text-xs">Classes</p>
              <p className="text-white font-semibold text-sm">
                {classes.length}
              </p>
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
        )}
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {NAV_LINKS.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={`flex items-center ${collapsed ? "justify-center px-2" : "gap-3 px-3"} py-2.5 rounded-lg text-sm font-medium transition-all ${
                active
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              <Icon size={17} className="flex-shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-gray-800 flex-shrink-0">
        <SignOutButton redirectUrl="/sign-in">
          <button
            type="button"
            title={collapsed ? "Sign Out" : undefined}
            className={`flex items-center ${collapsed ? "justify-center px-2" : "gap-3 px-3"} py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 w-full transition-all`}
          >
            <LogOut size={17} />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </SignOutButton>
      </div>
    </div>
  );
}
