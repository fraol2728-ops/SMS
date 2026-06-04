import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { StudentShell } from "@/components/student/layout/StudentShell";
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
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // Read role directly from Clerk publicMetadata — most reliable.
  const clerkUser = await currentUser();
  const role = clerkUser?.publicMetadata?.role as string | undefined;

  if (role !== "STUDENT") {
    redirect("/unauthorized?reason=not-student");
  }

  // Find or sync DB user.
  let dbUser = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: studentUserInclude,
  });

  // If DB user not found, try by email and sync clerkId.
  if (!dbUser) {
    const email = clerkUser?.emailAddresses[0]?.emailAddress?.toLowerCase();

    if (email) {
      const byEmail = await prisma.user.findUnique({
        where: { email },
        include: studentUserInclude,
      });

      if (byEmail) {
        dbUser = await prisma.user.update({
          where: { email },
          data: { clerkId: userId },
          include: studentUserInclude,
        });
      }
    }
  }

  if (!dbUser) {
    // Student exists in Clerk but not in DB.
    // Show a helpful page instead of a generic unauthorized message.
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
