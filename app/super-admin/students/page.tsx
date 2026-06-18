export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import type {
  ClassType,
  EnrollmentStatus,
  Gender,
  Prisma,
} from "@prisma/client";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { StudentsFilterClient } from "@/components/admin/students/StudentsFilterClient";
import { prisma } from "@/lib/prisma";

export default async function SuperAdminStudentsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    campusId?: string;
    page?: string;
    q?: string;
    gender?: string;
    courseId?: string;
    classType?: string;
    paymentStatus?: string;
    hasRemaining?: string;
    status?: string;
  }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const params = (await searchParams) ?? {};
  const campusId = params.campusId ?? null;
  const PAGE_SIZE = 20;
  const currentPage = Math.max(1, Number(params.page ?? 1) || 1);
  const q = params.q?.trim();
  const genderFilter = params.gender;
  const courseIdFilter = params.courseId;
  const classTypeFilter = params.classType;
  const paymentStatusFilter = params.paymentStatus;
  const hasRemainingFilter = params.hasRemaining;
  const statusFilter = params.status ?? "ACTIVE";
  const enrollmentStatus =
    statusFilter === "ALL" ? undefined : statusFilter || "ACTIVE";

  const where: Prisma.StudentProfileWhereInput = {
    user: {
      role: "STUDENT",
      ...(campusId ? { campusId } : {}),
      ...(genderFilter ? { gender: genderFilter as Gender } : {}),
    },
    ...(q
      ? {
          OR: [
            { studentCode: { contains: q, mode: "insensitive" } },
            { user: { firstName: { contains: q, mode: "insensitive" } } },
            { user: { lastName: { contains: q, mode: "insensitive" } } },
            { user: { phone: { contains: q } } },
          ],
        }
      : {}),
  };

  if (
    enrollmentStatus ||
    courseIdFilter ||
    classTypeFilter ||
    hasRemainingFilter
  ) {
    where.enrollments = {
      some: {
        ...(enrollmentStatus
          ? { status: enrollmentStatus as EnrollmentStatus }
          : {}),
        ...(courseIdFilter || classTypeFilter
          ? {
              class: {
                ...(courseIdFilter ? { courseId: courseIdFilter } : {}),
                ...(classTypeFilter
                  ? { classType: classTypeFilter as ClassType }
                  : {}),
              },
            }
          : {}),
        ...(hasRemainingFilter === "yes"
          ? {
              paymentRemaining: {
                status: { not: "PAID" },
                remainingAmount: { gt: 0 },
              },
            }
          : {}),
      },
    };
  }

  if (hasRemainingFilter === "no") {
    where.enrollments = {
      none: {
        paymentRemaining: {
          status: { not: "PAID" },
          remainingAmount: { gt: 0 },
        },
      },
    };
  }

  const [students, totalCount] = await Promise.all([
    prisma.studentProfile.findMany({
      where,
      include: {
        user: true,
        enrollments: {
          where: enrollmentStatus
            ? { status: enrollmentStatus as EnrollmentStatus }
            : {},
          include: {
            class: { include: { course: true, lab: true } },
            payments: { where: { status: "PAID" }, take: 1 },
            paymentRemaining: {
              select: { remainingAmount: true, status: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { registrationDate: "desc" },
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.studentProfile.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const [totalStudents, maleCount, femaleCount, withRemainingCount, courses] =
    await Promise.all([
      prisma.studentProfile.count({
        where: { user: { ...(campusId ? { campusId } : {}), role: "STUDENT" } },
      }),
      prisma.user.count({
        where: {
          ...(campusId ? { campusId } : {}),
          role: "STUDENT",
          gender: "MALE",
        },
      }),
      prisma.user.count({
        where: {
          ...(campusId ? { campusId } : {}),
          role: "STUDENT",
          gender: "FEMALE",
        },
      }),
      prisma.paymentRemaining.count({
        where: {
          status: { not: "PAID" },
          remainingAmount: { gt: 0 },
          enrollment: { class: { ...(campusId ? { campusId } : {}) } },
        },
      }),
      prisma.course.findMany({
        where: campusId ? { campusId } : {},
        select: { id: true, title: true },
        orderBy: { title: "asc" },
      }),
    ]);

  const fullyPaidCount = await prisma.studentProfile.count({
    where: {
      user: { ...(campusId ? { campusId } : {}), role: "STUDENT" },
      enrollments: {
        none: {
          paymentRemaining: {
            status: { not: "PAID" },
            remainingAmount: { gt: 0 },
          },
        },
      },
    },
  });

  const courseStudentCounts = await Promise.all(
    courses.map(async (course) => {
      const studentCount = await prisma.studentProfile.count({
        where: {
          user: { ...(campusId ? { campusId } : {}), role: "STUDENT" },
          enrollments: {
            some: { status: "ACTIVE", class: { courseId: course.id } },
          },
        },
      });
      return { ...course, studentCount };
    }),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Students"
        description={`${totalCount} student${totalCount !== 1 ? "s" : ""} found`}
        action={{
          label: "Add Student",
          href: `/super-admin/students/new?campusId=${campusId ?? ""}`,
        }}
      />
      <StudentsFilterClient
        students={students}
        totalCount={totalCount}
        totalPages={totalPages}
        currentPage={currentPage}
        courses={courses}
        courseStudentCounts={courseStudentCounts}
        analytics={{
          total: totalStudents,
          male: maleCount,
          female: femaleCount,
          withRemaining: withRemainingCount,
          fullyPaid: fullyPaidCount,
        }}
        currentFilters={{
          q: q ?? "",
          gender: genderFilter ?? "",
          courseId: courseIdFilter ?? "",
          classType: classTypeFilter ?? "",
          paymentStatus: paymentStatusFilter ?? "",
          hasRemaining: hasRemainingFilter ?? "",
          status: statusFilter,
        }}
        detailHrefPrefix="/super-admin/students"
        campusId={campusId}
      />
    </div>
  );
}
