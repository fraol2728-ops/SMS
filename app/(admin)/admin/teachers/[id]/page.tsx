import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteConfirmDialog } from "@/components/admin/shared/DeleteConfirmDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCurrentUserCampusId } from "@/lib/campus";
import { CLASS_DAYS, TIME_SLOTS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export default async function TeacherDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const campusId = await getCurrentUserCampusId();
  const t = await prisma.user.findFirst({
    where: { id, ...(campusId ? { campusId } : {}) },
    include: {
      teacherProfile: {
        include: {
          classes: {
            include: {
              course: true,
              lab: { select: { name: true } },
              _count: { select: { enrollments: true } },
            },
          },
        },
      },
    },
  });

  if (!t) notFound();

  const classes = t.teacherProfile?.classes ?? [];
  const totalClasses = classes.length;
  const totalCapacity = classes.reduce((sum, cls) => sum + (cls.capacity ?? 0), 0);
  const totalStudents = classes.reduce(
    (sum, cls) => sum + (cls._count?.enrollments ?? 0),
    0,
  );
  const groupClasses = classes.filter((cls) => cls.classType === "GROUP").length;
  const personalClasses = classes.filter((cls) => cls.classType === "PERSONAL").length;
  const specialty = t.teacherProfile?.specialty ?? "No specialty set";
  const bio = t.teacherProfile?.bio ?? "No bio available.";
  const initials = `${t.firstName?.[0] ?? "T"}${t.lastName?.[0] ?? ""}`;

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-slate-900 to-slate-600 text-2xl font-semibold text-white shadow-lg">
                {initials}
              </div>
              <div className="min-w-0 space-y-4">
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-2xl font-semibold tracking-tight truncate">
                      {t.firstName} {t.lastName}
                    </h1>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-700">
                      Teacher
                    </span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 text-sm text-slate-600">
                    <p>
                      <span className="font-semibold text-slate-900">Email:</span> {t.email}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-900">Specialty:</span> {specialty}
                    </p>
                    <p className="sm:col-span-2 text-slate-700">{bio}</p>
                  </div>
                </div>
                <div className="grid gap-8 grid-cols-1 md:grid-cols-2 xl:grid-cols-4 justify-items-center">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-center w-full max-w-[220px]">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Classes</p>
                    <p className="mt-3 text-2xl font-semibold text-slate-900">{totalClasses}</p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-center w-full max-w-[220px]">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Total students</p>
                    <p className="mt-3 text-2xl font-semibold text-slate-900">{totalStudents}</p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-center w-full max-w-[220px]">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Group classes</p>
                    <p className="mt-3 text-2xl font-semibold text-slate-900">{groupClasses}</p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-center w-full max-w-[220px]">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Personal classes</p>
                    <p className="mt-3 text-2xl font-semibold text-slate-900">{personalClasses}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-start gap-3 sm:items-end">
              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:justify-end sm:space-x-3">
                <Button asChild size="sm">
                  <a href={`/admin/teachers/${t.id}/edit`}>Edit Teacher</a>
                </Button>
                <DeleteConfirmDialog
                  label="Delete Teacher"
                  dialogTitle="Delete this teacher?"
                  dialogDescription="This action cannot be undone. Remove the teacher only if they are no longer assigned to any classes."
                  endpoint="/api/admin/delete-teacher"
                  payload={{ id: t.id }}
                  successRedirect="/admin/teachers"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Class schedule</h2>
              <p className="text-sm text-slate-500">Overview of classes assigned to this teacher.</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-700">
              {totalClasses} classes
            </span>
          </div>
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100 text-left text-xs uppercase tracking-[0.16em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">Course</th>
                  <th className="px-4 py-3">Lab</th>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Days</th>
                  <th className="px-4 py-3">Capacity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {classes.map((cls) => (
                  <tr key={cls.id} className="group hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4 font-medium text-slate-900">
                      <Link href={`/admin/classes/${cls.id}`} className="block w-full text-slate-900 hover:text-slate-900">
                        {cls.course.title}
                      </Link>
                    </td>
                    <td className="px-4 py-4">
                      <Link href={`/admin/classes/${cls.id}`} className="block w-full text-slate-700 hover:text-slate-900">
                        {cls.lab.name}
                      </Link>
                    </td>
                    <td className="px-4 py-4">
                      <Link href={`/admin/classes/${cls.id}`} className="block w-full text-slate-700 hover:text-slate-900">
                        {TIME_SLOTS[cls.timeSlot as keyof typeof TIME_SLOTS]}
                      </Link>
                    </td>
                    <td className="px-4 py-4">
                      <Link href={`/admin/classes/${cls.id}`} className="block w-full text-slate-700 hover:text-slate-900">
                        {CLASS_DAYS[cls.days as keyof typeof CLASS_DAYS]}
                      </Link>
                    </td>
                    <td className="px-4 py-4">
                      <Link href={`/admin/classes/${cls.id}`} className="block w-full text-slate-700 hover:text-slate-900">
                        {cls.capacity}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
