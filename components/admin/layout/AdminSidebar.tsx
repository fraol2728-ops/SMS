"use client";

import { SignOutButton } from "@clerk/nextjs";
import {
  AlertCircle,
  Award,
  Bell,
  BookOpen,
  Calendar,
  CalendarDays,
  CheckSquare,
  ClipboardCheck,
  Clock,
  CreditCard,
  Database,
  FileCheck,
  FileText,
  GraduationCap,
  History,
  LayoutDashboard,
  LogOut,
  type LucideIcon,
  Mail,
  MessageSquare,
  MessageSquarePlus,
  Package,
  UserMinus,
  Users,
  UserX,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

const NAV_GROUPS: { label: string; links: NavLink[] }[] = [
  {
    label: "MAIN",
    links: [
      {
        href: "/admin",
        label: "Dashboard",
        icon: LayoutDashboard,
        exact: true,
      },
    ],
  },
  {
    label: "PEOPLE",
    links: [
      { href: "/admin/students", label: "Students", icon: Users },
      { href: "/admin/withdrawn", label: "Withdrawn", icon: UserX },
      { href: "/admin/dropped", label: "Dropped", icon: UserMinus },
      { href: "/admin/teachers", label: "Teachers", icon: GraduationCap },
    ],
  },
  {
    label: "ACADEMICS",
    links: [
      { href: "/admin/courses", label: "Courses", icon: BookOpen },
      { href: "/admin/classes", label: "Classes", icon: Calendar },
      { href: "/admin/waitlist", label: "Waitlist", icon: Clock },
      { href: "/admin/attendance", label: "Attendance", icon: ClipboardCheck },
    ],
  },
  {
    label: "FINANCE",
    links: [
      { href: "/admin/payments", label: "Payments", icon: CreditCard },
      { href: "/admin/remaining", label: "Remaining", icon: AlertCircle },
    ],
  },
  {
    label: "RECORDS",
    links: [
      { href: "/admin/reports", label: "Reports", icon: FileText },
      { href: "/admin/backup", label: "Backup", icon: Database },
      { href: "/admin/feedback", label: "Feedback", icon: MessageSquare },
      { href: "/admin/certificates", label: "Certificates", icon: Award },
      { href: "/admin/history", label: "History", icon: History },
    ],
  },
  {
    label: "OPERATIONS",
    links: [
      { href: "/admin/tasks", label: "Tasks", icon: CheckSquare },
      { href: "/admin/mail", label: "Mail", icon: Mail },
      { href: "/admin/coc", label: "COC", icon: FileCheck },
      { href: "/admin/requests", label: "Requests", icon: MessageSquarePlus },
      { href: "/admin/inventory", label: "Inventory", icon: Package },
    ],
  },
  {
    label: "SYSTEM",
    links: [
      { href: "/admin/notifications", label: "Notifications", icon: Bell },
      { href: "/admin/events", label: "Events", icon: CalendarDays },
      { href: "/admin/docs", label: "Docs", icon: BookOpen },
    ],
  },
];

type AdminLayoutUser = {
  firstName: string;
  lastName: string;
  role: string;
  campus?: { name: string } | null;
};

export function AdminSidebar({
  user,
  theme = "dark",
  collapsed = false,
}: {
  user: AdminLayoutUser;
  theme?: string;
  collapsed?: boolean;
}) {
  const pathname = usePathname();
  void theme;
  const initials = `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`;

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950">
      <div className="flex-shrink-0 border-gray-800/80 border-b px-3 py-3">
        <div
          className={`flex items-center ${collapsed ? "justify-center" : "gap-3"} rounded-2xl border border-gray-700/50 bg-gradient-to-br from-gray-800 to-gray-800/50 p-3 shadow-lg shadow-blue-500/5 transition-all duration-300 ease-out hover:border-blue-500/30 hover:shadow-blue-500/10`}
          title={collapsed ? `${user.firstName} ${user.lastName}` : undefined}
        >
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 font-bold text-sm text-white shadow-md shadow-blue-500/20">
            {initials}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate font-semibold text-sm text-white">
                {user.firstName} {user.lastName}
              </p>
              <p className="truncate text-gray-400 text-xs">{user.role}</p>
            </div>
          )}
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar-track]:bg-transparent">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="px-3 pt-4 pb-1 font-bold text-[10px] text-gray-500 uppercase tracking-wider">
                {group.label}
              </p>
            )}
            {group.links.map(({ href, label, icon: Icon, exact }) => {
              const active = isActive(href, exact);
              return (
                <Link
                  className={`group relative flex items-center ${collapsed ? "justify-center px-2" : "gap-3 px-3"} rounded-xl py-2.5 font-medium text-sm transition-all duration-200 ease-out before:absolute before:left-0 before:top-1/2 before:h-5 before:w-1 before:-translate-y-1/2 before:rounded-r-full before:bg-blue-500 before:transition-all before:duration-300 before:ease-out ${
                    active
                      ? "bg-blue-600/15 text-blue-400 shadow-lg shadow-blue-500/5 before:opacity-100"
                      : "text-gray-400 before:opacity-0 hover:bg-white/5 hover:text-white"
                  }`}
                  href={href}
                  key={href}
                  prefetch={false}
                  title={collapsed ? label : undefined}
                >
                  <Icon
                    className={`flex-shrink-0 transition-all duration-200 ease-out group-hover:scale-110 ${active ? "text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.45)]" : ""}`}
                    size={17}
                  />
                  {!collapsed && <span className="truncate">{label}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="flex-shrink-0 border-gray-800/80 border-t p-3">
        <SignOutButton redirectUrl="/sign-in">
          <button
            className={`group flex w-full items-center ${collapsed ? "justify-center px-2" : "gap-3 px-3"} rounded-xl py-2.5 font-medium text-gray-400 text-sm transition-all duration-200 ease-out hover:bg-red-500/10 hover:text-red-400`}
            title={collapsed ? "Sign Out" : undefined}
            type="button"
          >
            <LogOut
              className="flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
              size={17}
            />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </SignOutButton>
      </div>
    </div>
  );
}
