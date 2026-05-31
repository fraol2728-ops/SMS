import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { TeacherHeader } from "@/components/teacher/layout/TeacherHeader";
import { TeacherSidebar } from "@/components/teacher/layout/TeacherSidebar";
import { prisma } from "@/lib/prisma";

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  const role = user?.publicMetadata?.role as string | undefined;
  if (role !== "TEACHER") redirect("/unauthorized");

  const dbUser = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      teacherProfile: {
        include: {
          classes: {
            where: { isActive: true },
            include: { course: true, lab: true },
          },
        },
      },
    },
  });

  if (!dbUser) redirect("/unauthorized");

  return (
    <div className="flex min-h-screen bg-gray-50">
      <TeacherSidebar
        teacher={dbUser}
        classes={dbUser.teacherProfile?.classes ?? []}
      />
      <div className="ml-64 flex flex-1 flex-col">
        <TeacherHeader teacher={dbUser} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
