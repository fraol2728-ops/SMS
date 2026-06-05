import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { StudentShell } from "@/components/student/layout/StudentShell";
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

  const dbUser = await resolveStudentUser(
    userId,
    email,
    studentUserInclude,
  );

  const clerkRole = await getAuthRole();
  const effectiveRole = clerkRole ?? dbUser?.role;

  if (effectiveRole !== "STUDENT") {
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

  return (
    <StudentShell user={dbUser} unreadCount={unreadCount}>
      {children}
    </StudentShell>
  );
}
