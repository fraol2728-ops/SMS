export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { Calendar, ClipboardCheck, Clock, Users } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireTeacher } from "@/lib/auth-check";
import { CLASS_DAYS, TIME_SLOTS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export default async function TeacherClassDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireTeacher();
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const teacher = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: { teacherProfile: true },
  });

  if (!teacher?.teacherProfile) redirect("/unauthorized");

  const classRecord = await prisma.class.findUnique({
    where: { id, status: "STARTED" },
    include: {
      course: true,
      lab: { include: { campus: true } },
      enrollments: {
        where: { status: "ACTIVE" },
        include: {
          student: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  phone: true,
                  email: true,
                  gender: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!classRecord) notFound();

  if (classRecord.teacherId !== teacher.teacherProfile.id) {
    redirect("/unauthorized");
  }

  const timeLabel = TIME_SLOTS[classRecord.timeSlot as keyof typeof TIME_SLOTS];
  const daysLabel = CLASS_DAYS[classRecord.days as keyof typeof CLASS_DAYS];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-bold text-2xl text-gray-900">
            {classRecord.course.title}
          </h1>
          <p className="mt-1 text-gray-500">
            {classRecord.lab?.name ?? "Online"} •{" "}
            {classRecord.lab?.campus.name ?? "Online"} • {timeLabel} •{" "}
            {daysLabel}
          </p>
        </div>
        <Link href={`/teacher/attendance?classId=${classRecord.id}`}>
          <button
            type="button"
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 font-medium text-sm text-white transition-colors hover:bg-blue-700"
          >
            <ClipboardCheck size={16} />
            Mark Attendance
          </button>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            label: "Students",
            value: classRecord.enrollments.length,
            icon: Users,
          },
          { label: "Capacity", value: classRecord.capacity, icon: Users },
          { label: "Time", value: timeLabel, icon: Clock },
          { label: "Days", value: daysLabel, icon: Calendar },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border bg-white p-4">
            <p className="mb-1 text-gray-400 text-xs">{label}</p>
            <p className="font-bold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-white p-6">
        <h2 className="mb-5 font-semibold text-gray-900">
          Enrolled Students ({classRecord.enrollments.length})
        </h2>

        {classRecord.enrollments.length === 0 ? (
          <div className="py-8 text-center">
            <Users size={32} className="mx-auto mb-2 text-gray-300" />
            <p className="text-gray-400">No students enrolled yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  {[
                    "#",
                    "Student",
                    "Code",
                    "Phone",
                    "Gender",
                    "Start Date",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-3 py-3 text-left font-medium text-gray-400 text-xs"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {classRecord.enrollments.map(
                  (enrollment: any, index: number) => {
                    const user = enrollment.student.user;
                    return (
                      <tr
                        key={enrollment.id}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="px-3 py-3 text-gray-400 text-xs">
                          {index + 1}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700 text-xs">
                              {user.firstName[0]}
                              {user.lastName[0]}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {user.firstName} {user.lastName}
                              </p>
                              <p className="text-gray-400 text-xs">
                                {user.email.includes("@exceed.local")
                                  ? ""
                                  : user.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <span className="rounded bg-gray-100 px-2 py-1 font-mono text-xs">
                            {enrollment.student.studentCode}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-gray-500">
                          {user.phone ?? "—"}
                        </td>
                        <td className="px-3 py-3 text-gray-500">
                          {user.gender ?? "—"}
                        </td>
                        <td className="px-3 py-3 text-gray-500">
                          {enrollment.startDate.toLocaleDateString("en-GB")}
                        </td>
                        <td className="px-3 py-3">
                          <Link href={`/teacher/students/${user.id}`}>
                            <button
                              type="button"
                              className="font-medium text-blue-600 text-xs hover:text-blue-800"
                            >
                              View
                            </button>
                          </Link>
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
