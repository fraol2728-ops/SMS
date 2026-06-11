import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Footer } from "@/components/shared/Footer";
import { TeacherHeader } from "@/components/teacher/layout/TeacherHeader";
import { TeacherSidebar } from "@/components/teacher/layout/TeacherSidebar";
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
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      <TeacherSidebar
        teacher={dbUser}
        classes={dbUser.teacherProfile?.classes ?? []}
      />
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        <TeacherHeader teacher={dbUser} />
        <main className="flex-1 p-4 sm:p-6 overflow-x-hidden">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
