export const dynamic = "force-dynamic";

import {
  BookOpen,
  Building2,
  Calendar,
  Clock,
  GraduationCap,
  Users,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ClassStatusControls } from "@/components/admin/classes/ClassStatusControls";
import { DropEnrollmentButton } from "@/components/admin/classes/DropEnrollmentButton";
import { DeleteConfirmDialog } from "@/components/admin/shared/DeleteConfirmDialog";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { StatusBadge } from "@/components/admin/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth-check";
import { CLASS_DAYS, TIME_SLOTS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export default async function ClassDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const classRecord = await prisma.class.findUnique({
    where: { id },
    include: {
      course: true,
      campus: true,
      lab: { select: { name: true } },
      teacher: {
        include: {
          user: true,
        },
      },
      enrollments: {
        where: { status: "ACTIVE" },
        include: {
          student: {
            include: {
              user: true,
            },
          },
          payments: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!classRecord) notFound();

  const timeLabel =
    classRecord.classType === "ONLINE"
      ? "Online"
      : TIME_SLOTS[classRecord.timeSlot as keyof typeof TIME_SLOTS];
  const daysLabel = CLASS_DAYS[classRecord.days as keyof typeof CLASS_DAYS];
  const activeStudents = classRecord.enrollments.length;
  const spotsLeft = classRecord.capacity - activeStudents;
  const capacityPercent = classRecord.capacity
    ? Math.round((activeStudents / classRecord.capacity) * 100)
    : 0;
  const today = new Date();
  const startDate = classRecord.startDate;
  const endDate = classRecord.endDate;
  const totalDays =
    startDate && endDate
      ? Math.ceil(
          (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
        )
      : 0;
  const elapsedDays = startDate
    ? Math.max(
        0,
        Math.ceil(
          (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
        ),
      )
    : 0;
  const progressPercent =
    totalDays > 0
      ? Math.min(100, Math.round((elapsedDays / totalDays) * 100))
      : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${classRecord.lab?.name ?? "Online"} — ${classRecord.course.title}`}
        description={`${classRecord.campus.name} Campus`}
        action={{
          label: "Edit class",
          href: `/admin/classes/${classRecord.id}/edit`,
        }}
      />
      <div className="flex justify-end">
        <DeleteConfirmDialog
          label="Delete Class"
          dialogTitle="Delete this class?"
          dialogDescription="This action cannot be undone. The class can only be deleted if there are no student enrollments or attendance records."
          endpoint="/api/admin/delete-class"
          payload={{ id: classRecord.id }}
          successRedirect="/admin/classes"
        />
      </div>

      <div className="bg-white border rounded-xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold">Class Status</h3>
            <span className="mt-2 inline-flex rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
              {classRecord.status}
            </span>
          </div>
          <ClassStatusControls
            classId={classRecord.id}
            status={classRecord.status}
          />
        </div>
      </div>
      {classRecord.status === "STARTED" && (
        <div className="bg-white border rounded-xl p-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">Course Progress</h3>
            <span className="text-sm font-medium">{progressPercent}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
            <div
              className={`h-4 rounded-full transition-all duration-500 ${progressPercent >= 100 ? "bg-green-500" : progressPercent >= 60 ? "bg-blue-500" : progressPercent >= 30 ? "bg-amber-500" : "bg-blue-400"}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>Day {elapsedDays}</span>
            <span>{Math.max(0, totalDays - elapsedDays)} days remaining</span>
            <span>Day {totalDays}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="flex items-start gap-3 rounded-xl border bg-white p-4">
          <div className="rounded-lg bg-blue-50 p-2">
            <Building2 size={18} className="text-blue-600" />
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Lab</p>
            <p className="font-semibold">{classRecord.lab?.name ?? "Online"}</p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-xl border bg-white p-4">
          <div className="rounded-lg bg-purple-50 p-2">
            <Clock size={18} className="text-purple-600" />
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Time</p>
            <p className="font-semibold">{timeLabel}</p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-xl border bg-white p-4">
          <div className="rounded-lg bg-green-50 p-2">
            <Calendar size={18} className="text-green-600" />
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Days</p>
            <p className="font-semibold">{daysLabel}</p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-xl border bg-white p-4">
          <div className="rounded-lg bg-amber-50 p-2">
            <Users size={18} className="text-amber-600" />
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Students</p>
            <p className="font-semibold">
              {activeStudents} / {classRecord.capacity}
              <span
                className={`ml-2 text-xs ${spotsLeft === 0 ? "text-red-500" : "text-green-500"}`}
              >
                {spotsLeft === 0 ? "FULL" : `${spotsLeft} spots left`}
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border bg-white p-6">
          <div className="mb-4 flex items-center gap-2">
            <GraduationCap size={18} className="text-muted-foreground" />
            <h2 className="font-semibold">Teacher</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700 text-lg">
              {classRecord.teacher.user.firstName[0]}
              {classRecord.teacher.user.lastName[0]}
            </div>
            <div>
              <p className="font-medium">
                {classRecord.teacher.user.firstName}{" "}
                {classRecord.teacher.user.lastName}
              </p>
              <p className="text-muted-foreground text-sm">
                {classRecord.teacher.user.email}
              </p>
              {classRecord.teacher.specialty && (
                <p className="mt-1 text-muted-foreground text-xs">
                  {classRecord.teacher.specialty}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-6">
          <div className="mb-4 flex items-center gap-2">
            <BookOpen size={18} className="text-muted-foreground" />
            <h2 className="font-semibold">Course</h2>
          </div>
          <div>
            <p className="font-medium text-lg">{classRecord.course.title}</p>
            <p className="mt-1 text-muted-foreground text-sm">
              Duration: {classRecord.course.durationWeeks} weeks
            </p>
            <p className="text-muted-foreground text-sm">
              Fee: ETB {classRecord.course.fee.toLocaleString()}
            </p>
            <p className="text-muted-foreground text-sm">
              Type: {classRecord.course.classType}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold">Capacity</h2>
          <span className="text-muted-foreground text-sm">
            {activeStudents} of {classRecord.capacity} students enrolled
          </span>
        </div>
        <div className="h-3 w-full rounded-full bg-gray-100">
          <div
            className={`h-3 rounded-full transition-all ${
              capacityPercent >= 100
                ? "bg-red-500"
                : capacityPercent >= 80
                  ? "bg-amber-500"
                  : "bg-green-500"
            }`}
            style={{ width: `${Math.min(capacityPercent, 100)}%` }}
          />
        </div>
        <p className="mt-1 text-muted-foreground text-xs">
          {capacityPercent}% full
        </p>
      </div>

      <div className="rounded-xl border bg-white p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-muted-foreground" />
            <h2 className="font-semibold">
              Enrolled Students ({activeStudents})
            </h2>
          </div>
          <Button asChild size="sm">
            <Link href="/admin/students/new">Add student</Link>
          </Button>
        </div>

        {classRecord.enrollments.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <Users size={40} className="mx-auto mb-3 opacity-30" />
            <p>No students enrolled in this class yet.</p>
            <Button asChild variant="outline" size="sm" className="mt-4">
              <Link href="/admin/students/new">Register first student</Link>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-2 py-3 text-left font-medium text-muted-foreground">
                    #
                  </th>
                  <th className="px-2 py-3 text-left font-medium text-muted-foreground">
                    Student
                  </th>
                  <th className="px-2 py-3 text-left font-medium text-muted-foreground">
                    Code
                  </th>
                  <th className="px-2 py-3 text-left font-medium text-muted-foreground">
                    Phone
                  </th>
                  <th className="px-2 py-3 text-left font-medium text-muted-foreground">
                    Start Date
                  </th>
                  <th className="px-2 py-3 text-left font-medium text-muted-foreground">
                    Payment
                  </th>
                  <th className="px-2 py-3 text-left font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="px-2 py-3 text-left font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {classRecord.enrollments.map(
                  (
                    enrollment: (typeof classRecord.enrollments)[number],
                    index: number,
                  ) => {
                    const student = enrollment.student;
                    const user = student.user;
                    const lastPayment = enrollment.payments[0];

                    return (
                      <tr
                        key={enrollment.id}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="px-2 py-3 text-muted-foreground">
                          {index + 1}
                        </td>
                        <td className="px-2 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700 text-xs">
                              {user.firstName[0]}
                              {user.lastName[0]}
                            </div>
                            <div>
                              <p className="font-medium">
                                {user.firstName} {user.lastName}
                              </p>
                              <p className="text-muted-foreground text-xs">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-3">
                          <span className="rounded bg-gray-100 px-2 py-1 font-mono text-xs">
                            {student.studentCode}
                          </span>
                        </td>
                        <td className="px-2 py-3 text-muted-foreground">
                          {user.phone ?? "—"}
                        </td>
                        <td className="px-2 py-3 text-muted-foreground">
                          {enrollment.startDate.toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-2 py-3">
                          {lastPayment ? (
                            <div>
                              <StatusBadge status={lastPayment.status} />
                              <p className="mt-1 text-muted-foreground text-xs">
                                ETB {lastPayment.amount.toLocaleString()}
                              </p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">
                              No payment
                            </span>
                          )}
                        </td>
                        <td className="px-2 py-3">
                          <StatusBadge status={enrollment.status} />
                        </td>
                        <td className="px-2 py-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <Button asChild size="sm" variant="outline">
                              <Link href={`/admin/students/${user.id}`}>
                                View
                              </Link>
                            </Button>
                            <DropEnrollmentButton
                              enrollmentId={enrollment.id}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  },
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
