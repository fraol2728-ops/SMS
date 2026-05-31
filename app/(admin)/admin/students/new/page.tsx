import Link from "next/link";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { StudentForm } from "@/components/admin/students/StudentForm";
import { requireAdmin } from "@/lib/auth-check";
import { getCurrentUserCampusId } from "@/lib/campus";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type ClassWithDateFields = {
  startDate: Date | null;
  endDate: Date | null;
};

export default async function NewStudentPage() {
  await requireAdmin();
  const campusId = await getCurrentUserCampusId();
  const classes = await prisma.class.findMany({
    where: {
      campusId: campusId ?? undefined,
      isActive: true,
      status: "REGISTRATION",
    },
    include: {
      course: { select: { title: true, fee: true } },
      lab: { select: { name: true } },
      teacher: {
        include: { user: { select: { firstName: true, lastName: true } } },
      },
      _count: { select: { enrollments: { where: { status: "ACTIVE" } } } },
    },
    orderBy: [{ lab: { name: "asc" } }, { timeSlot: "asc" }],
  });

  const formattedClasses = classes.map((classRecord) => ({
    ...classRecord,
    startDate: classRecord.startDate?.toISOString().slice(0, 10) ?? null,
    endDate: classRecord.endDate?.toISOString().slice(0, 10) ?? null,
  }));

  return (
    <div className="space-y-6">
      <PageHeader title="Register new student" />
      {classes.length === 0 ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          No active classes exist yet. Please{" "}
          <Link href="/admin/classes/new" className="font-semibold underline">
            add a class
          </Link>{" "}
          before registering a student.
        </div>
      ) : null}
      <StudentForm classes={formattedClasses} />
    </div>
  );
}
