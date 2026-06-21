import { redirect } from "next/navigation";
import { StudentShell } from "@/components/student/layout/StudentShell";
import {
  getFeedbackForEnrollment,
  shouldShowFeedbackModal,
} from "@/lib/actions/feedback";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";

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
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in");
  }
  if (user.role !== "STUDENT") {
    redirect("/unauthorized?reason=not-student");
  }

  const dbUser = await prisma.user.findUnique({
    where: { clerkId: user.clerkId },
    include: studentUserInclude,
  });

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
