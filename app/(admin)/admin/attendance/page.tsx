export const dynamic = "force-dynamic";

import type { AttendanceStatus, Prisma } from "@prisma/client";
import { AttendanceClient } from "@/components/admin/attendance/AttendanceClient";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { requireAdmin } from "@/lib/auth-check";
import { getCurrentUserCampusId } from "@/lib/campus";
import { prisma } from "@/lib/prisma";

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: { date?: string; classId?: string; status?: string };
}) {
  await requireAdmin();
  const campusId = await getCurrentUserCampusId();

  const dateStr = searchParams.date ?? new Date().toISOString().slice(0, 10);
  const selectedDate = new Date(dateStr);
  selectedDate.setHours(0, 0, 0, 0);
  const nextDay = new Date(selectedDate);
  nextDay.setDate(nextDay.getDate() + 1);

  const classIdFilter = searchParams.classId;
  const statusFilter = searchParams.status;

  const [attendance, classes, overallStats] = await Promise.all([
    prisma.attendance.findMany({
      where: {
        date: { gte: selectedDate, lt: nextDay },
        class: { campusId: campusId ?? undefined },
        ...(classIdFilter ? { classId: classIdFilter } : {}),
        ...(statusFilter ? { status: statusFilter as AttendanceStatus } : {}),
      },
      include: {
        enrollment: { include: { student: { include: { user: true } } } },
        class: { include: { course: true, lab: true } },
      },
      orderBy: [
        { class: { lab: { name: "asc" } } },
        { enrollment: { student: { user: { firstName: "asc" } } } },
      ],
    }),
    prisma.class.findMany({
      where: {
        campusId: campusId ?? undefined,
        status: "STARTED",
        isActive: true,
      },
      include: { course: true, lab: true },
      orderBy: [{ lab: { name: "asc" } }, { timeSlot: "asc" }],
    }),
    prisma.attendance.groupBy({
      by: ["status"],
      where: {
        class: { campusId: campusId ?? undefined },
        date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      _count: true,
    }),
  ]);

  const totalSessions = overallStats.reduce((s, g) => s + g._count, 0);
  const presentSessions =
    overallStats.find((g) => g.status === "PRESENT")?._count ?? 0;
  const overallRate =
    totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : 0;

  const presentCount = attendance.filter((a) => a.status === "PRESENT").length;
  const absentCount = attendance.filter((a) => a.status === "ABSENT").length;
  const lateCount = attendance.filter((a) => a.status === "LATE").length;

  const byClass: Record<
    string,
    {
      classInfo: Prisma.ClassGetPayload<{
        include: { course: true; lab: true };
      }> | null;
      records: typeof attendance;
    }
  > = {};
  attendance.forEach((a) => {
    if (!byClass[a.classId ?? ""]) {
      byClass[a.classId ?? ""] = { classInfo: a.class, records: [] };
    }
    byClass[a.classId ?? ""].records.push(a);
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Attendance" description="Daily attendance tracking" />
      <AttendanceClient
        byClass={byClass}
        classes={classes}
        dateStr={dateStr}
        stats={{
          present: presentCount,
          absent: absentCount,
          late: lateCount,
          overallRate,
        }}
        currentFilters={{
          classId: classIdFilter ?? "",
          status: statusFilter ?? "",
        }}
      />
    </div>
  );
}
