import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { StudentShell } from "@/components/student/layout/StudentShell";
import {
  getFeedbackForEnrollment,
  shouldShowFeedbackModal,
} from "@/lib/actions/feedback";
import { getAuthRole } from "@/lib/clerk-role";
import { prisma } from "@/lib/prisma";
import { resolveStudentUser } from "@/lib/resolve-student-user";

const studentUserInclude = {
  studentProfile: {
    include: {
      enrollments: {
        where: { status: "ACTIVE" },
        include: {
          class: {
            include: {
              course: true,
              lab: true,
              teacher: { include: { user: true } },
            },
          },
        },
        take: 1,
      },
    },
  },
  campus: true,
} as const;

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses[0]?.emailAddress?.toLowerCase();

  const dbUser = await resolveStudentUser(userId, email, studentUserInclude);

  const clerkRole = await getAuthRole();
  const effectiveRole = clerkRole ?? dbUser?.role;

  if (effectiveRole !== "STUDENT") {
    // If we found a STUDENT in DB but Clerk role isn't set, update it now
    if (dbUser?.role === "STUDENT" && !clerkRole && userId) {
      try {
        const { clerkClient } = await import("@clerk/nextjs/server");
        const clerk = await clerkClient();
        await clerk.users.updateUser(userId, {
          publicMetadata: { role: "STUDENT" },
        });
        console.log(`✅ Updated Clerk role for student ${userId}`);
      } catch (err) {
        console.error("Failed to update Clerk role:", err);
      }
    }

    redirect("/unauthorized?reason=not-student");
  }

  if (!dbUser) {
    redirect("/unauthorized?reason=no-profile");
  }

  if (!dbUser.studentProfile) {
    redirect("/unauthorized?reason=no-profile");
  }

  const unreadCount = await prisma.studentNotification
    .count({
      where: { studentId: dbUser.id, isRead: false },
    })
    .catch(() => 0);

  const activeEnrollment = dbUser.studentProfile.enrollments?.[0];
  const enrollmentId = activeEnrollment?.id;
  const classId = activeEnrollment?.class?.id ?? null;

  const showFeedbackModal = enrollmentId
    ? await shouldShowFeedbackModal(enrollmentId)
    : false;
  const existingFeedback = enrollmentId
    ? await getFeedbackForEnrollment(enrollmentId)
    : null;

  return (
    <StudentShell
      user={dbUser}
      unreadCount={unreadCount}
      enrollmentId={enrollmentId}
      classId={classId}
      showFeedbackModal={showFeedbackModal}
      existingFeedback={existingFeedback}
    >
      {children}
    </StudentShell>
  );
}
