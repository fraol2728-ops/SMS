import { redirect } from "next/navigation";
import { TeacherShell } from "@/components/teacher/layout/TeacherShell";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (user.role !== "TEACHER") redirect("/unauthorized");

  const dbUser = await prisma.user.findUnique({
    where: { clerkId: user.clerkId },
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
