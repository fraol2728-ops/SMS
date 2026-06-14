export const dynamic = "force-dynamic";

import type {
  ClassDays,
  ClassStatus,
  ClassType,
  Prisma,
  TimeSlot,
} from "@prisma/client";
import { ClassesFilterClient } from "@/components/admin/classes/ClassesFilterClient";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { requireAdmin } from "@/lib/auth-check";
import { getCurrentUserCampusId } from "@/lib/campus";
import { TIME_SLOTS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export default async function ClassesPage({
  searchParams,
}: {
  searchParams?: Promise<{
    status?: string;
    courseId?: string;
    classType?: string;
    timeSlot?: string;
    days?: string;
    labId?: string;
  }>;
}) {
  await requireAdmin();
  const campusId = await getCurrentUserCampusId();
  const params = (await searchParams) ?? {};

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

  const courseStudentCounts = await Promise.all(
    courses.map(async (course) => {
      const activeStudents = await prisma.enrollment.count({
        where: {
          status: "ACTIVE",
          class: { campusId: campusId ?? undefined, courseId: course.id },
        },
      });
      const totalClasses = await prisma.class.count({
        where: {
          campusId: campusId ?? undefined,
          courseId: course.id,
          isActive: true,
          status: "STARTED",
        },
      });
      return { ...course, activeStudents, totalClasses };
    }),
  );

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
        action={{ label: "New Class", href: "/admin/classes/new" }}
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
      />
    </div>
  );
}
