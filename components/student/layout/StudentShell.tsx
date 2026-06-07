"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Footer } from "@/components/shared/Footer";
import type { ExistingFeedback } from "../FeedbackForm";
import { StudentHeader } from "./StudentHeader";
import { StudentSidebar } from "./StudentSidebar";

export function StudentShell({
  user,
  unreadCount,
  children,
  enrollmentId,
  classId,
  showFeedbackModal,
  existingFeedback,
}: {
  user: {
    firstName?: string | null;
    lastName?: string | null;
    studentProfile?: {
      studentCode?: string | null;
      enrollments?: Array<{
        class?: { course?: { title?: string | null } | null } | null;
      }>;
    } | null;
  };
  unreadCount: number;
  children: ReactNode;
  enrollmentId?: string;
  classId?: string | null;
  showFeedbackModal?: boolean;
  existingFeedback?: ExistingFeedback | null;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // The sidebar should close each time the student navigates to a new portal page.
  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname is intentionally used as the route-change signal.
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close student navigation"
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <StudentSidebar
        user={user}
        unreadCount={unreadCount}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        enrollmentId={enrollmentId}
        classId={classId}
        showFeedbackModal={showFeedbackModal}
        existingFeedback={existingFeedback}
      />
      <div className="flex min-h-screen flex-col lg:ml-72">
        <StudentHeader
          user={user}
          unreadCount={unreadCount}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 p-4 sm:p-6">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
