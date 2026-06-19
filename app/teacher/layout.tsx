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
  if (!user) {
    console.log("[LAYOUT:teacher]", {
      reason: "no-db-user",
      userId: user?.id,
      clerkId: user?.clerkId,
      role: user?.role,
      pathname: "/teacher",
      timestamp: new Date().toISOString(),
    });
    redirect("/sign-in");
  }
  if (user.role !== "TEACHER") {
    console.log("[LAYOUT:teacher]", {
      reason: "role-not-authorized",
      userId: user.id,
      clerkId: user.clerkId,
      role: user.role,
      pathname: "/teacher",
      timestamp: new Date().toISOString(),
    });
    redirect("/unauthorized");
  }

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

  if (!dbUser) {
    console.log("[LAYOUT:teacher]", {
      reason: "no-teacher-db-user",
      userId: user.id,
      clerkId: user.clerkId,
      role: user.role,
      pathname: "/teacher",
      timestamp: new Date().toISOString(),
    });
    redirect("/unauthorized");
  }

  return (
    <TeacherShell
      teacher={dbUser}
      classes={dbUser.teacherProfile?.classes ?? []}
    >
      {children}
    </TeacherShell>
  );
}
