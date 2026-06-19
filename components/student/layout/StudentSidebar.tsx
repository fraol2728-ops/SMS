"use client";

import {
  Award,
  Bell,
  BookOpen,
  CalendarDays,
  ChevronRight,
  ClipboardCheck,
  CreditCard,
  FolderOpen,
  LayoutDashboard,
  MessageSquare,
  User,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ExistingFeedback } from "../FeedbackForm";
import { FeedbackModal } from "../FeedbackModal";

type StudentPortalUser = {
  firstName?: string | null;
  lastName?: string | null;
  profilePhoto?: string | null;
  studentProfile?: {
    studentCode?: string | null;
    enrollments?: Array<{
      class?: { course?: { title?: string | null } | null } | null;
    }>;
  } | null;
};

interface StudentSidebarProps {
  user: StudentPortalUser;
  unreadCount: number;
  open: boolean;
  onClose: () => void;
  enrollmentId?: string;
  classId?: string | null;
  showFeedbackModal?: boolean;
  existingFeedback?: ExistingFeedback | null;
}

type SidebarContentProps = {
  user: StudentPortalUser;
  courseName?: string | null;
  unreadCount: number;
  isActive: (href: string, exact?: boolean) => boolean;
  onClose: () => void;
  enrollmentId?: string;
  classId?: string | null;
  showFeedbackModal?: boolean;
  existingFeedback?: ExistingFeedback | null;
};

const NAV_LINKS = [
  { href: "/student", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/student/class", label: "My Class", icon: BookOpen },
  { href: "/student/attendance", label: "Attendance", icon: ClipboardCheck },
  { href: "/student/payments", label: "Payments", icon: CreditCard },
  { href: "/student/materials", label: "Materials", icon: FolderOpen },
  { href: "/student/feedback", label: "Feedback", icon: MessageSquare },
  { href: "/student/certificate", label: "Certificate", icon: Award },
  { href: "/student/notifications", label: "Notifications", icon: Bell },
  { href: "/student/events", label: "Events", icon: CalendarDays },
  { href: "/student/profile", label: "My Profile", icon: User },
  { href: "/student/docs", label: "Docs", icon: BookOpen },
];

export function StudentSidebar({
  user,
  unreadCount,
  open,
  onClose,
  enrollmentId,
  classId,
  showFeedbackModal,
  existingFeedback,
}: StudentSidebarProps) {
  const pathname = usePathname();
  const enrollment = user.studentProfile?.enrollments?.[0];
  const courseName = enrollment?.class?.course?.title;

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col lg:flex">
        <SidebarContent
          user={user}
          courseName={courseName}
          unreadCount={unreadCount}
          isActive={isActive}
          onClose={onClose}
          enrollmentId={enrollmentId}
          classId={classId}
          showFeedbackModal={showFeedbackModal}
          existingFeedback={existingFeedback}
        />
      </aside>
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-80 flex-col transition-transform duration-300 lg:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent
          user={user}
          courseName={courseName}
          unreadCount={unreadCount}
          isActive={isActive}
          onClose={onClose}
          enrollmentId={enrollmentId}
          classId={classId}
          showFeedbackModal={showFeedbackModal}
          existingFeedback={existingFeedback}
        />
      </aside>
    </>
  );
}

function SidebarContent({
  user,
  courseName,
  unreadCount,
  isActive,
  onClose,
  enrollmentId,
  classId,
  showFeedbackModal,
  existingFeedback,
}: SidebarContentProps) {
  return (
    <div className="flex h-full flex-col border-r border-gray-100 bg-white shadow-xl">
      <div className="border-b border-gray-100 p-6">
        <div className="mb-5 flex items-center justify-between">
          <Image
            src="/Exceed Logo  with Mottto.png"
            alt="Exceed Logo"
            width={120}
            height={40}
            className="h-auto"
            priority
          />
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 lg:hidden"
          >
            <X size={18} />
          </button>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 p-4 text-white">
          <div className="mb-3 flex items-center gap-3">
            {user.profilePhoto ? (
              <Image
                src={user.profilePhoto}
                alt=""
                width={44}
                height={44}
                unoptimized
                className="h-11 w-11 flex-shrink-0 rounded-xl object-cover"
              />
            ) : (
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-white/20 text-lg font-bold">
                {user.firstName?.[0]}
                {user.lastName?.[0]}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate font-bold leading-tight">
                {user.firstName} {user.lastName}
              </p>
              <p className="truncate text-xs text-white/70">
                {user.studentProfile?.studentCode}
              </p>
            </div>
          </div>
          {courseName && (
            <div className="rounded-xl bg-white/10 px-3 py-2">
              <p className="text-xs text-white/70">Enrolled in</p>
              <p className="truncate text-sm font-semibold text-white">
                {courseName}
              </p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {NAV_LINKS.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all ${
                active
                  ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-200"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon size={18} className="flex-shrink-0" />
              <span className="flex-1">{label}</span>
              {label === "Notifications" && unreadCount > 0 && (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                    active ? "bg-white/20 text-white" : "bg-red-500 text-white"
                  }`}
                >
                  {unreadCount}
                </span>
              )}
              {active && <ChevronRight size={14} className="opacity-70" />}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-100 p-4">
        <FeedbackModal
          enrollmentId={enrollmentId}
          classId={classId}
          existingFeedback={existingFeedback}
          shouldShowModal={showFeedbackModal}
        />
      </div>
    </div>
  );
}
