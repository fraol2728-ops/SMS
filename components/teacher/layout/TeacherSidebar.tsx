"use client";

import { SignOutButton } from "@clerk/nextjs";
import {
  BookOpen,
  CheckSquare,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  LogOut,
  Mail,
  Package,
  User,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type TeacherSidebarUser = {
  firstName: string;
  lastName: string;
  teacherProfile?: { teacherCode: string } | null;
};

const navLinks = [
  { href: "/teacher", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/teacher/classes", label: "My Classes", icon: BookOpen },
  { href: "/teacher/attendance", label: "Attendance", icon: ClipboardCheck },
  { href: "/teacher/students", label: "My Students", icon: Users },
  { href: "/teacher/reports", label: "Reports", icon: FileText },
  { href: "/teacher/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/teacher/mail", label: "Mail", icon: Mail },
  { href: "/teacher/inventory", label: "Inventory", icon: Package },
  { href: "/teacher/profile", label: "My Profile", icon: User },
];

export function TeacherSidebar({
  teacher,
  classes,
}: {
  teacher: TeacherSidebarUser;
  classes: unknown[];
}) {
  const pathname = usePathname();

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-gray-900">
      <div className="border-gray-800 border-b p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500">
            <span className="font-bold text-sm text-white">E</span>
          </div>
          <div>
            <h1 className="font-bold text-lg text-white leading-none">
              Exceed
            </h1>
            <p className="mt-0.5 text-gray-400 text-xs">Teacher Portal</p>
          </div>
        </div>
      </div>

      <div className="border-gray-800 border-b px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20 font-bold text-blue-400">
            {teacher.firstName[0]}
            {teacher.lastName[0]}
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-sm text-white">
              {teacher.firstName} {teacher.lastName}
            </p>
            <p className="truncate text-gray-400 text-xs">
              {teacher.teacherProfile?.teacherCode}
            </p>
          </div>
        </div>
        <div className="mt-3 rounded-lg bg-gray-800 px-3 py-2">
          <p className="text-gray-400 text-xs">Active Classes</p>
          <p className="font-semibold text-white">{classes.length}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {navLinks.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 font-medium text-sm transition-all ${
                active
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-gray-800 border-t p-3">
        <SignOutButton redirectUrl="/sign-in">
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 font-medium text-gray-400 text-sm transition-all hover:bg-gray-800 hover:text-white"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </SignOutButton>
      </div>
    </aside>
  );
}
