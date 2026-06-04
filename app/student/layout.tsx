import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { StudentShell } from "@/components/student/layout/StudentShell";
import { prisma } from "@/lib/prisma";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const clerkUser = await currentUser();
  const role = clerkUser?.publicMetadata?.role as string | undefined;
  if (role !== "STUDENT") redirect("/unauthorized");

  const dbUser = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
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
    },
  });

  if (!dbUser) redirect("/unauthorized");

  const unreadCount = await prisma.studentNotification.count({
    where: { studentId: dbUser.id, isRead: false },
  });

  return (
    <StudentShell user={dbUser} unreadCount={unreadCount}>
      {children}
    </StudentShell>
  );
}
