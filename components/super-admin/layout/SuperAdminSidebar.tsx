"use client";

import {
  AlertCircle,
  Award,
  Bell,
  BookOpen,
  Building2,
  Calendar,
  CalendarDays,
  CheckSquare,
  ChevronRight,
  ClipboardCheck,
  Clock,
  CreditCard,
  Database,
  FileCheck,
  FileText,
  GraduationCap,
  History,
  LayoutDashboard,
  Mail,
  MessageSquare,
  MessageSquarePlus,
  Package,
  Settings,
  Shield,
  UserMinus,
  Users,
  UserX,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const CAMPUS_NAV = [
  { href: "", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/students", label: "Students", icon: Users },
  { href: "/withdrawn", label: "Withdrawn", icon: UserX },
  { href: "/dropped", label: "Dropped", icon: UserMinus },
  { href: "/courses", label: "Courses", icon: BookOpen },
  { href: "/classes", label: "Classes", icon: Calendar },
  { href: "/teachers", label: "Teachers", icon: GraduationCap },
  { href: "/waitlist", label: "Waitlist", icon: Clock },
  { href: "/attendance", label: "Attendance", icon: ClipboardCheck },
  { href: "/payments", label: "Payments", icon: CreditCard },
  { href: "/remaining", label: "Remaining", icon: AlertCircle },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/backup", label: "Backup", icon: Database },
  { href: "/feedback", label: "Feedback", icon: MessageSquare },
  { href: "/certificates", label: "Certificates", icon: Award },
  { href: "/coc", label: "COC", icon: FileCheck },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/mail", label: "Mail", icon: Mail },
  { href: "/requests", label: "Requests", icon: MessageSquarePlus },
  { href: "/history", label: "History", icon: History },
  { href: "/inventory", label: "Inventory", icon: Package },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/events", label: "Events", icon: CalendarDays },
];

const SUPER_ADMIN_NAV = [
  { href: "/super-admin/admins", label: "All Admins", icon: Shield },
  {
    href: "/super-admin/campuses",
    label: "Campus Management",
    icon: Building2,
  },
  { href: "/super-admin/settings", label: "System Settings", icon: Settings },
];

type Campus = { id: string; name: string; color: string };
type Admin = { firstName: string; lastName: string };

const CAMPUS_COLORS: Record<
  string,
  { header: string; active: string; hover: string; border: string }
> = {
  blue: {
    header: "bg-blue-600",
    active: "bg-blue-600 text-white",
    hover: "hover:bg-blue-50 dark:hover:bg-blue-900/20",
    border: "border-blue-200",
  },
  green: {
    header: "bg-green-600",
    active: "bg-green-600 text-white",
    hover: "hover:bg-green-50 dark:hover:bg-green-900/20",
    border: "border-green-200",
  },
  purple: {
    header: "bg-purple-600",
    active: "bg-purple-600 text-white",
    hover: "hover:bg-purple-50 dark:hover:bg-purple-900/20",
    border: "border-purple-200",
  },
  red: {
    header: "bg-red-600",
    active: "bg-red-600 text-white",
    hover: "hover:bg-red-50 dark:hover:bg-red-900/20",
    border: "border-red-200",
  },
  amber: {
    header: "bg-amber-500",
    active: "bg-amber-500 text-white",
    hover: "hover:bg-amber-50 dark:hover:bg-amber-900/20",
    border: "border-amber-200",
  },
  rose: {
    header: "bg-rose-600",
    active: "bg-rose-600 text-white",
    hover: "hover:bg-rose-50 dark:hover:bg-rose-900/20",
    border: "border-rose-200",
  },
  indigo: {
    header: "bg-indigo-600",
    active: "bg-indigo-600 text-white",
    hover: "hover:bg-indigo-50 dark:hover:bg-indigo-900/20",
    border: "border-indigo-200",
  },
  teal: {
    header: "bg-teal-600",
    active: "bg-teal-600 text-white",
    hover: "hover:bg-teal-50 dark:hover:bg-teal-900/20",
    border: "border-teal-200",
  },
};

function getCampusInitials(name: string) {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function SuperAdminSidebar({
  campus,
  campusId,
  admin: _admin,
  onClose,
}: {
  campus: Campus | undefined;
  campusId: string;
  admin: Admin;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const colors = CAMPUS_COLORS[campus?.color ?? "blue"] ?? CAMPUS_COLORS.blue;

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  function campusHref(suffix: string) {
    const base = "/super-admin";
    const query = campusId ? `?campusId=${campusId}` : "";
    if (suffix === "") return `${base}${query}`;
    return `${base}${suffix}${query}`;
  }

  function isActiveCampusLink(suffix: string, exact?: boolean) {
    if (suffix === "" || exact)
      return pathname === "/super-admin" || pathname === "/super-admin/";
    return pathname.startsWith(`/super-admin${suffix}`);
  }

  return (
    <div className="flex h-full flex-col border-gray-200 border-r bg-white dark:border-gray-700 dark:bg-gray-900">
      <div
        className={`${colors.header} flex flex-shrink-0 items-center justify-between p-4`}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 font-bold text-sm text-white">
            {campus ? getCampusInitials(campus.name) : "SA"}
          </div>
          <div>
            <p className="font-semibold text-white leading-none">
              {campus?.name ?? "Super Admin"}
            </p>
            <p className="mt-0.5 text-white/70 text-xs">Campus Portal</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-white/70 hover:text-white lg:hidden"
          type="button"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <p className="px-3 py-2 font-semibold text-gray-400 text-xs uppercase tracking-wider dark:text-gray-500">
          {campus?.name ?? "Campus"}
        </p>

        <div className="space-y-0.5">
          {CAMPUS_NAV.map(({ href, label, icon: Icon, exact }) => {
            const fullHref = campusHref(href);
            const active = isActiveCampusLink(href, exact);

            return (
              <Link
                key={href}
                href={fullHref}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 font-medium text-sm transition-all ${
                  active
                    ? colors.active
                    : `text-gray-600 ${colors.hover} hover:text-gray-900 dark:text-gray-400 dark:hover:text-white`
                }`}
              >
                <Icon size={16} className="flex-shrink-0" />
                <span className="truncate">{label}</span>
                {active ? (
                  <ChevronRight
                    size={12}
                    className="ml-auto flex-shrink-0 opacity-70"
                  />
                ) : null}
              </Link>
            );
          })}
        </div>

        <div className="mt-4 border-gray-200 border-t pt-4 dark:border-gray-700">
          <p className="px-3 py-2 font-semibold text-gray-400 text-xs uppercase tracking-wider dark:text-gray-500">
            Super Admin
          </p>
          <div className="space-y-0.5">
            {SUPER_ADMIN_NAV.map(({ href, label, icon: Icon }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onClose}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 font-medium text-sm transition-all ${
                    active
                      ? "bg-purple-600 text-white"
                      : "text-gray-600 hover:bg-purple-50 hover:text-purple-700 dark:text-gray-400 dark:hover:bg-purple-900/20 dark:hover:text-purple-400"
                  }`}
                >
                  <Icon size={16} className="flex-shrink-0" />
                  <span className="truncate">{label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}
