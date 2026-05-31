export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { CLASS_DAYS, TIME_SLOTS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export default async function TeacherStudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const teacher = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: { teacherProfile: true },
  });

  if (!teacher?.teacherProfile) redirect("/unauthorized");

  const student = await prisma.user.findUnique({
    where: { id },
    include: {
      studentProfile: {
        include: {
          enrollments: {
            where: { status: "ACTIVE" },
            include: {
              class: {
                include: { course: true, lab: true },
              },
              attendance: {
                orderBy: { date: "desc" },
                take: 30,
              },
            },
          },
        },
      },
    },
  });

  if (!student?.studentProfile) notFound();

  const teacherClassIds = await prisma.class.findMany({
    where: { teacherId: teacher.teacherProfile.id },
    select: { id: true },
  });
  const teacherClassIdSet = new Set(teacherClassIds.map((c: any) => c.id));

  const relevantEnrollments = student.studentProfile.enrollments.filter(
    (e: any) => e.classId && teacherClassIdSet.has(e.classId),
  );

  if (relevantEnrollments.length === 0) {
    redirect("/unauthorized");
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="rounded-xl border bg-white p-6">
        <div className="flex items-center gap-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 font-bold text-2xl text-blue-700">
            {student.firstName[0]}
            {student.lastName[0]}
          </div>
          <div>
            <h1 className="font-bold text-2xl text-gray-900">
              {student.firstName} {student.lastName}
            </h1>
            <p className="text-gray-500">
              {student.studentProfile.studentCode}
            </p>
            <div className="mt-2 flex items-center gap-4 text-gray-400 text-sm">
              {student.phone && <span>📱 {student.phone}</span>}
              {student.gender && <span>{student.gender}</span>}
            </div>
          </div>
        </div>
      </div>

      {relevantEnrollments.map((enrollment: any) => {
        const presentCount = enrollment.attendance.filter(
          (a: any) => a.status === "PRESENT",
        ).length;
        const absentCount = enrollment.attendance.filter(
          (a: any) => a.status === "ABSENT",
        ).length;
        const lateCount = enrollment.attendance.filter(
          (a: any) => a.status === "LATE",
        ).length;
        const total = presentCount + absentCount + lateCount;
        const rate = total > 0 ? Math.round((presentCount / total) * 100) : 0;

        return (
          <div
            key={enrollment.id}
            className="space-y-5 rounded-xl border bg-white p-6"
          >
            <div>
              <h2 className="font-semibold text-gray-900">
                {enrollment.class?.course.title}
              </h2>
              <p className="text-gray-500 text-sm">
                {enrollment.class?.lab.name} •{" "}
                {enrollment.class &&
                  TIME_SLOTS[
                    enrollment.class.timeSlot as keyof typeof TIME_SLOTS
                  ]}{" "}
                •{" "}
                {enrollment.class &&
                  CLASS_DAYS[enrollment.class.days as keyof typeof CLASS_DAYS]}
              </p>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {[
                {
                  label: "Present",
                  value: presentCount,
                  color: "text-green-700",
                  bg: "bg-green-50",
                },
                {
                  label: "Absent",
                  value: absentCount,
                  color: "text-red-700",
                  bg: "bg-red-50",
                },
                {
                  label: "Late",
                  value: lateCount,
                  color: "text-amber-700",
                  bg: "bg-amber-50",
                },
                {
                  label: "Rate",
                  value: `${rate}%`,
                  color: "text-blue-700",
                  bg: "bg-blue-50",
                },
              ].map(({ label, value, color, bg }) => (
                <div key={label} className={`${bg} rounded-xl p-3 text-center`}>
                  <p className={`font-bold text-xl ${color}`}>{value}</p>
                  <p className="mt-0.5 text-gray-400 text-xs">{label}</p>
                </div>
              ))}
            </div>

            <div>
              <p className="mb-3 font-medium text-gray-700 text-sm">
                Recent Attendance
              </p>
              <div className="flex flex-wrap gap-2">
                {enrollment.attendance.slice(0, 20).map((a: any) => (
                  <div
                    key={a.id}
                    title={new Date(a.date).toLocaleDateString("en-GB")}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg font-bold text-xs ${
                      a.status === "PRESENT"
                        ? "bg-green-100 text-green-700"
                        : a.status === "ABSENT"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {a.status === "PRESENT"
                      ? "✓"
                      : a.status === "ABSENT"
                        ? "✗"
                        : "L"}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
