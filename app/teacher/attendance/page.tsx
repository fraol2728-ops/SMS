export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AttendanceMarker } from "@/components/teacher/attendance/AttendanceMarker";
import { requireTeacher } from "@/lib/auth-check";
import { TIME_SLOTS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export default async function TeacherAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ classId?: string; date?: string }>;
}) {
  await requireTeacher();
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const teacher = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: { teacherProfile: true },
  });

  if (!teacher?.teacherProfile) redirect("/unauthorized");

  const classes = await prisma.class.findMany({
    where: {
      teacherId: teacher.teacherProfile.id,
      isActive: true,
      status: "STARTED",
    },
    include: {
      course: true,
      lab: true,
    },
    orderBy: [{ lab: { name: "asc" } }, { timeSlot: "asc" }],
  });

  const resolvedSearchParams = await searchParams;
  const selectedClassId = resolvedSearchParams.classId ?? classes[0]?.id ?? "";
  const selectedDate =
    resolvedSearchParams.date ?? new Date().toISOString().slice(0, 10);

  const selectedClass = selectedClassId
    ? await prisma.class.findFirst({
        where: { id: selectedClassId, teacherId: teacher.teacherProfile.id },
        include: {
          course: true,
          lab: true,
          enrollments: {
            where: { status: "ACTIVE" },
            include: {
              student: {
                include: {
                  user: {
                    select: {
                      firstName: true,
                      lastName: true,
                      phone: true,
                    },
                  },
                },
              },
            },
            orderBy: { createdAt: "asc" },
          },
        },
      })
    : null;

  const existingAttendance =
    selectedClass?.id && selectedDate
      ? await prisma.attendance.findMany({
          where: {
            classId: selectedClass.id,
            date: {
              gte: new Date(selectedDate),
              lt: new Date(
                new Date(selectedDate).getTime() + 24 * 60 * 60 * 1000,
              ),
            },
          },
        })
      : [];

  const recentHistory = await prisma.attendance.findMany({
    where: {
      class: { teacherId: teacher.teacherProfile.id },
    },
    include: {
      class: { include: { course: true, lab: true } },
      enrollment: {
        include: {
          student: {
            include: {
              user: {
                select: { firstName: true, lastName: true },
              },
            },
          },
        },
      },
    },
    orderBy: { date: "desc" },
    take: 50,
  });

  const historyByDateClass: Record<
    string,
    {
      date: Date;
      class: (typeof recentHistory)[number]["class"];
      records: typeof recentHistory;
      presentCount: number;
      absentCount: number;
    }
  > = {};

  recentHistory.forEach((a: any) => {
    const key = `${a.date.toISOString().slice(0, 10)}_${a.classId}`;
    if (!historyByDateClass[key]) {
      historyByDateClass[key] = {
        date: a.date,
        class: a.class,
        records: [],
        presentCount: 0,
        absentCount: 0,
      };
    }
    historyByDateClass[key].records.push(a);
    if (a.status === "PRESENT") historyByDateClass[key].presentCount++;
    if (a.status === "ABSENT") historyByDateClass[key].absentCount++;
  });

  const historyGroups = Object.values(historyByDateClass).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-2xl text-gray-900">Attendance</h1>
        <p className="mt-1 text-gray-500">Mark and view student attendance</p>
      </div>

      <AttendanceMarker
        classes={classes.map((c: any) => ({
          id: c.id,
          label: `${c.lab?.name ?? "Online"} — ${c.course.title} (${TIME_SLOTS[c.timeSlot as keyof typeof TIME_SLOTS]})`,
          timeSlot: c.timeSlot,
          days: c.days,
        }))}
        selectedClassId={selectedClass?.id ?? ""}
        selectedDate={selectedDate}
        students={selectedClass?.enrollments ?? []}
        existingAttendance={existingAttendance}
        historyGroups={historyGroups}
      />
    </div>
  );
}
