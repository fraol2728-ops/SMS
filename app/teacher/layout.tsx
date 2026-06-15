import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { TeacherShell } from "@/components/teacher/layout/TeacherShell";
import { prisma } from "@/lib/prisma";

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId, sessionClaims } = await auth();
  if (!userId) redirect("/sign-in");

  const role = (sessionClaims?.metadata as any)?.role as string | undefined;
  if (role !== "TEACHER") redirect("/unauthorized");

  const dbUser = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      teacherProfile: {
        include: {
          classes: {
            where: { isActive: true, status: "STARTED" },
            include: {
              course: true,
              lab: true,
              _count: {
                select: { enrollments: { where: { status: "ACTIVE" } } },
              },
            },
          },
        },
      },
    },
  });

  if (!dbUser) redirect("/unauthorized");

  return (
    <TeacherShell
      teacher={dbUser}
      classes={dbUser.teacherProfile?.classes ?? []}
    >
      {children}
    </TeacherShell>
  );
}
