export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ClassForm } from "@/components/admin/classes/ClassForm";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { prisma } from "@/lib/prisma";

export default async function SuperAdminNewClassPage({
  searchParams,
}: {
  searchParams?: Promise<{ campusId?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { campusId } = (await searchParams) ?? {};

  const [courses, teachers, labs] = await Promise.all([
    prisma.course.findMany({
      where: { isActive: true, campusId: campusId ?? undefined },
      orderBy: { title: "asc" },
      select: { id: true, title: true, durationWeeks: true, fee: true },
    }),
    prisma.user.findMany({
      where: { role: "TEACHER", campusId: campusId ?? undefined },
      include: { teacherProfile: true },
      orderBy: { firstName: "asc" },
    }),
    prisma.lab.findMany({
      where: { campusId: campusId ?? undefined, isActive: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Create New Class" />
      <ClassForm
        courses={courses}
        teachers={teachers}
        labs={labs}
        redirectBasePath={`/super-admin/classes?campusId=${campusId ?? ""}`}
      />
    </div>
  );
}
