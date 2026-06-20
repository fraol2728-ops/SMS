"use client";

import { SignOutButton, useUser } from "@clerk/nextjs";
import {
  AlertCircle,
  Bell,
  BookOpen,
  ClipboardList,
  CreditCard,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Package,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const items = [
  ["/admin", "Dashboard", LayoutDashboard],
  ["/admin/students", "Students", Users],
  ["/admin/withdrawn", "Withdrawn", AlertCircle],
  ["/admin/dropped", "Dropped", AlertCircle],
  ["/admin/courses", "Courses", BookOpen],
  ["/admin/classes", "Classes", LayoutGrid],
  ["/admin/teachers", "Teachers", GraduationCap],
  ["/admin/waitlist", "Waitlist", ClipboardList],
  ["/admin/attendance", "Attendance", ClipboardList],
  ["/admin/payments", "Payments", CreditCard],
  ["/admin/remaining", "Remaining", AlertCircle],
  ["/admin/reports", "Reports", FileText],
  ["/admin/certificates", "Certificates", GraduationCap],
  ["/admin/history", "History", BookOpen],
  ["/admin/inventory", "Inventory", Package],
  ["/admin/notifications", "Notifications", Bell],
] as const;

export function AdminSidebarClient({
  campusIndicator,
  overdueCount = 0,
  unreadReportCount = 0,
}: {
  campusIndicator: React.ReactNode;
  overdueCount?: number;
  unreadReportCount?: number;
}) {
  const path = usePathname();
  const { user } = useUser();

  return (
    <aside className="fixed left-0 top-0 flex h-screen w-60 flex-col border-r bg-white">
      <div className="p-6 pb-3 text-xl font-bold">Exceed</div>
      <div className="px-3">{campusIndicator}</div>
      <nav className="space-y-1 px-3">
        {items.map(([href, label, Icon]) => (
          <Link
            key={href}
            href={href}
            prefetch={false}
            className={cn(
              "flex items-center gap-2 rounded px-3 py-2 text-sm",
              path === href
                ? "bg-gray-100 font-medium"
                : "text-muted-foreground hover:bg-gray-50",
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="flex-1">{label}</span>
            {href === "/admin/remaining" && overdueCount > 0 ? (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                {overdueCount}
              </span>
            ) : null}
            {href === "/admin/reports" && unreadReportCount > 0 ? (
              <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                {unreadReportCount > 9 ? "9+" : unreadReportCount}
              </span>
            ) : null}
          </Link>
        ))}
      </nav>
      <div className="mt-auto border-t p-4">
        <div className="mb-3 flex items-center gap-2">
          <Avatar>
            <AvatarFallback>
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="text-sm">
            <p className="font-medium">{user?.fullName}</p>
          </div>
        </div>
        <SignOutButton>
          <button
            type="button"
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </SignOutButton>
      </div>
    </aside>
  );
}
