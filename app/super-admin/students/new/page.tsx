export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { StudentForm } from "@/components/admin/students/StudentForm";
import CalculatorWidget from "@/components/ui/CalculatorWidget";
import { prisma } from "@/lib/prisma";

export default async function SuperAdminNewStudentPage({
  searchParams,
}: {
  searchParams?: Promise<{
    campusId?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { campusId, firstName, lastName, phone } = (await searchParams) ?? {};

  const classes = await prisma.class.findMany({
    where: {
      campusId: campusId ?? undefined,
      isActive: true,
      status: { in: ["REGISTRATION", "STARTED"] },
    },
    include: {
      course: { select: { title: true, fee: true } },
      lab: { select: { name: true } },
      teacher: {
        include: { user: { select: { firstName: true, lastName: true } } },
      },
      _count: {
        select: { enrollments: { where: { status: "ACTIVE" } } },
      },
    },
    orderBy: [{ status: "asc" }, { lab: { name: "asc" } }, { timeSlot: "asc" }],
  });

  const formattedClasses = classes.map((klass) => ({
    ...klass,
    startDate: klass.startDate?.toISOString().slice(0, 10) ?? null,
    endDate: klass.endDate?.toISOString().slice(0, 10) ?? null,
  }));

  return (
    <div className="space-y-6">
      <PageHeader title="Register New Student" />
      <StudentForm
        classes={formattedClasses}
        defaultPersonalValues={{ firstName, lastName, phone }}
        redirectBasePath={`/super-admin/students?campusId=${campusId ?? ""}`}
        classCreateHref={`/super-admin/classes/new?campusId=${campusId ?? ""}`}
      />
      <CalculatorWidget />
    </div>
  );
}
