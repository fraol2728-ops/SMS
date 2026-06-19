export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import type {
  ClassDays,
  ClassStatus,
  ClassType,
  Prisma,
  TimeSlot,
} from "@prisma/client";
import { redirect } from "next/navigation";
import { ClassesFilterClient } from "@/components/admin/classes/ClassesFilterClient";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { TIME_SLOTS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export default async function SuperAdminClassesPage({
  searchParams,
}: {
  searchParams?: Promise<{
    campusId?: string;
    status?: string;
    courseId?: string;
    classType?: string;
    timeSlot?: string;
    days?: string;
    labId?: string;
  }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const params = (await searchParams) ?? {};
  const campusId = params.campusId ?? null;
  const statusFilter = params.status ?? "STARTED";
  const courseIdFilter = params.courseId;
  const classTypeFilter = params.classType;
  const timeSlotFilter = params.timeSlot;
  const daysFilter = params.days;
  const labIdFilter = params.labId;

  const where: Prisma.ClassWhereInput = {
    campusId: campusId ?? undefined,
    isActive: true,
    ...(statusFilter !== "ALL" ? { status: statusFilter as ClassStatus } : {}),
    ...(courseIdFilter ? { courseId: courseIdFilter } : {}),
    ...(classTypeFilter ? { classType: classTypeFilter as ClassType } : {}),
    ...(timeSlotFilter ? { timeSlot: timeSlotFilter as TimeSlot } : {}),
    ...(daysFilter ? { days: daysFilter as ClassDays } : {}),
    ...(labIdFilter ? { labId: labIdFilter } : {}),
  };

  const [classes, courses, labs] = await Promise.all([
    prisma.class.findMany({
      where,
      include: {
        course: true,
        lab: true,
        teacher: { include: { user: true } },
        _count: { select: { enrollments: { where: { status: "ACTIVE" } } } },
      },
      orderBy: [{ lab: { name: "asc" } }, { timeSlot: "asc" }],
    }),
    prisma.course.findMany({
      where: campusId ? { campusId } : {},
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    }),
    prisma.lab.findMany({
      where: campusId ? { campusId } : {},
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const [regCount, startedCount, endedCount] = await Promise.all([
    prisma.class.count({
      where: {
        campusId: campusId ?? undefined,
        status: "REGISTRATION",
        isActive: true,
      },
    }),
    prisma.class.count({
      where: {
        campusId: campusId ?? undefined,
        status: "STARTED",
        isActive: true,
      },
    }),
    prisma.class.count({
      where: {
        campusId: campusId ?? undefined,
        status: "ENDED",
        isActive: true,
      },
    }),
  ]);

  const [activeStudentCounts, totalClassCounts] = await Promise.all([
    prisma.enrollment.groupBy({
      by: ["courseId"],
      where: {
        status: "ACTIVE",
        class: { campusId: campusId ?? undefined },
      },
      _count: true,
    }),
    prisma.class.groupBy({
      by: ["courseId"],
      where: {
        campusId: campusId ?? undefined,
        isActive: true,
        status: "STARTED",
      },
      _count: true,
    }),
  ]);

  const activeStudentsByCourse = new Map(
    activeStudentCounts.map((count) => [count.courseId, count._count]),
  );
  const totalClassesByCourse = new Map(
    totalClassCounts.map((count) => [count.courseId, count._count]),
  );

  const courseStudentCounts = courses.map((course) => ({
    ...course,
    activeStudents: activeStudentsByCourse.get(course.id) ?? 0,
    totalClasses: totalClassesByCourse.get(course.id) ?? 0,
  }));

  const timeSlotCounts = await Promise.all(
    Object.keys(TIME_SLOTS).map(async (slot) => {
      const count = await prisma.enrollment.count({
        where: {
          status: "ACTIVE",
          class: {
            campusId: campusId ?? undefined,
            timeSlot: slot as TimeSlot,
            status: "STARTED",
          },
        },
      });
      return {
        slot,
        label: TIME_SLOTS[slot as keyof typeof TIME_SLOTS],
        count,
      };
    }),
  );

  const [mwfCount, ttsCount, groupCount, personalCount, onlineCount] =
    await Promise.all([
      prisma.enrollment.count({
        where: {
          status: "ACTIVE",
          class: {
            campusId: campusId ?? undefined,
            days: "MWF",
            status: "STARTED",
          },
        },
      }),
      prisma.enrollment.count({
        where: {
          status: "ACTIVE",
          class: {
            campusId: campusId ?? undefined,
            days: "TTS",
            status: "STARTED",
          },
        },
      }),
      prisma.enrollment.count({
        where: {
          status: "ACTIVE",
          class: {
            campusId: campusId ?? undefined,
            classType: "GROUP",
            status: "STARTED",
          },
        },
      }),
      prisma.enrollment.count({
        where: {
          status: "ACTIVE",
          class: {
            campusId: campusId ?? undefined,
            classType: "PERSONAL",
            status: "STARTED",
          },
        },
      }),
      prisma.enrollment.count({
        where: {
          status: "ACTIVE",
          class: {
            campusId: campusId ?? undefined,
            classType: "ONLINE",
            status: "STARTED",
          },
        },
      }),
    ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Classes"
        action={{
          label: "New Class",
          href: `/super-admin/classes/new?campusId=${campusId ?? ""}`,
        }}
      />
      <ClassesFilterClient
        classes={classes}
        courses={courses}
        labs={labs}
        statusCounts={{
          registration: regCount,
          started: startedCount,
          ended: endedCount,
        }}
        courseStudentCounts={courseStudentCounts}
        timeSlotCounts={timeSlotCounts}
        scheduleCounts={{ mwf: mwfCount, tts: ttsCount }}
        typeCounts={{
          group: groupCount,
          personal: personalCount,
          online: onlineCount,
        }}
        currentFilters={{
          status: statusFilter,
          courseId: courseIdFilter ?? "",
          classType: classTypeFilter ?? "",
          timeSlot: timeSlotFilter ?? "",
          days: daysFilter ?? "",
          labId: labIdFilter ?? "",
        }}
        detailHrefPrefix="/super-admin/classes"
        campusId={campusId}
      />
    </div>
  );
}
