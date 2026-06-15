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
  FileCheck,
  FileText,
  GraduationCap,
  History,
  LayoutDashboard,
  LogOut,
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

const NAV_LINKS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/students", label: "Students", icon: Users },
  { href: "/admin/withdrawn", label: "Withdrawn", icon: UserX },
  { href: "/admin/dropped", label: "Dropped", icon: UserMinus },
  { href: "/admin/courses", label: "Courses", icon: BookOpen },
  { href: "/admin/classes", label: "Classes", icon: Calendar },
  { href: "/admin/teachers", label: "Teachers", icon: GraduationCap },
  { href: "/admin/waitlist", label: "Waitlist", icon: Clock },
  { href: "/admin/attendance", label: "Attendance", icon: ClipboardCheck },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/remaining", label: "Remaining", icon: AlertCircle },
  { href: "/admin/reports", label: "Reports", icon: FileText },
  { href: "/admin/feedback", label: "Feedback", icon: MessageSquare },
  { href: "/admin/certificates", label: "Certificates", icon: Award },
  { href: "/admin/history", label: "History", icon: History },
  { href: "/admin/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/admin/mail", label: "Mail", icon: Mail },
  { href: "/admin/coc", label: "COC", icon: FileCheck },
  { href: "/admin/requests", label: "Requests", icon: MessageSquarePlus },
  { href: "/admin/inventory", label: "Inventory", icon: Package },
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
  { href: "/admin/events", label: "Events", icon: CalendarDays },
];

const THEME_COLORS: Record<
  string,
  {
    bg: string;
    active: string;
    text: string;
    header: string;
    userBg: string;
    logo: string;
  }
> = {
  dark: {
    bg: "bg-gray-900",
    active: "bg-blue-600 text-white",
    text: "text-gray-400 hover:bg-gray-800 hover:text-white",
    header: "border-gray-800",
    userBg: "bg-gray-800",
    logo: "bg-blue-600",
  },
  blue: {
    bg: "bg-blue-950",
    active: "bg-blue-500 text-white",
    text: "text-blue-300 hover:bg-blue-900 hover:text-white",
    header: "border-blue-900",
    userBg: "bg-blue-900",
    logo: "bg-blue-500",
  },
  green: {
    bg: "bg-green-950",
    active: "bg-green-600 text-white",
    text: "text-green-300 hover:bg-green-900 hover:text-white",
    header: "border-green-900",
    userBg: "bg-green-900",
    logo: "bg-green-500",
  },
  purple: {
    bg: "bg-purple-950",
    active: "bg-purple-600 text-white",
    text: "text-purple-300 hover:bg-purple-900 hover:text-white",
    header: "border-purple-900",
    userBg: "bg-purple-900",
    logo: "bg-purple-500",
  },
  slate: {
    bg: "bg-slate-900",
    active: "bg-slate-500 text-white",
    text: "text-slate-400 hover:bg-slate-800 hover:text-white",
    header: "border-slate-800",
    userBg: "bg-slate-800",
    logo: "bg-slate-500",
  },
  red: {
    bg: "bg-red-950",
    active: "bg-red-600 text-white",
    text: "text-red-300 hover:bg-red-900 hover:text-white",
    header: "border-red-900",
    userBg: "bg-red-900",
    logo: "bg-red-600",
  },
};

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
  const colors = THEME_COLORS[theme] ?? THEME_COLORS.dark;

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <div className={`${colors.bg} flex h-full flex-col`}>
      <div className={`flex-shrink-0 border-b px-3 py-3 ${colors.header}`}>
        <div
          className={`flex items-center ${collapsed ? "justify-center" : "gap-3"} rounded-xl p-3 ${colors.userBg}`}
          title={collapsed ? `${user.firstName} ${user.lastName}` : undefined}
        >
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-bold text-white">
            {user.firstName?.[0]}
            {user.lastName?.[0]}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">
                {user.firstName} {user.lastName}
              </p>
              <p className="truncate text-xs text-white opacity-60">
                {user.role}
              </p>
            </div>
          )}
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {NAV_LINKS.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              className={`flex items-center ${collapsed ? "justify-center px-2" : "gap-3 px-3"} rounded-lg py-2.5 text-sm font-medium transition-all ${active ? colors.active : colors.text}`}
              href={href}
              key={href}
              title={collapsed ? label : undefined}
            >
              <Icon className="flex-shrink-0" size={17} />
              {!collapsed && <span className="truncate">{label}</span>}
            </Link>
          );
        })}
      </nav>
      <div className={`flex-shrink-0 border-t p-3 ${colors.header}`}>
        <SignOutButton redirectUrl="/sign-in">
          <button
            className={`flex w-full items-center ${collapsed ? "justify-center px-2" : "gap-3 px-3"} rounded-lg py-2.5 text-sm font-medium transition-all ${colors.text}`}
            title={collapsed ? "Sign Out" : undefined}
            type="button"
          >
            <LogOut className="flex-shrink-0" size={17} />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </SignOutButton>
      </div>
    </div>
  );
}
