"use server";

import { auth } from "@clerk/nextjs/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";

async function getCampusId(): Promise<string | null> {
  const { userId } = await auth();
  if (!userId) return null;
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { campusId: true, role: true },
  });
  return user?.campusId ?? null;
}

export async function getBackupData(type: string, campusId?: string | null) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
    throw new Error("Unauthorized");
  }
  if (user.role !== "SUPER_ADMIN") campusId = user.campusId;

  const effectiveCampusId = campusId ?? (await getCampusId());
  const userFilter = effectiveCampusId ? { campusId: effectiveCampusId } : {};
  const classFilter = effectiveCampusId
    ? { class: { campusId: effectiveCampusId } }
    : {};

  switch (type) {
    case "students":
      return prisma.studentProfile.findMany({
        where: { user: userFilter },
        include: {
          user: true,
          enrollments: {
            include: {
              class: { include: { course: true, lab: true } },
              payments: true,
              paymentRemaining: true,
            },
          },
          certificates: true,
        },
        orderBy: { studentCode: "asc" },
      });

    case "withdrawn":
      return prisma.withdrawal.findMany({
        where: { enrollment: classFilter },
        include: {
          enrollment: {
            include: {
              student: { include: { user: true } },
              class: { include: { course: true } },
            },
          },
        },
        orderBy: { startDate: "desc" },
      });

    case "dropped":
      return prisma.enrollment.findMany({
        where: { status: "DROPPED", ...classFilter },
        include: {
          student: { include: { user: true } },
          class: { include: { course: true, lab: true } },
          payments: true,
        },
        orderBy: { updatedAt: "desc" },
      });

    case "courses":
      return prisma.course.findMany({
        where: effectiveCampusId ? { campusId: effectiveCampusId } : {},
        orderBy: { title: "asc" },
      });

    case "classes":
      return prisma.class.findMany({
        where: effectiveCampusId ? { campusId: effectiveCampusId } : {},
        include: {
          course: true,
          lab: true,
          teacher: { include: { user: true } },
          _count: { select: { enrollments: { where: { status: "ACTIVE" } } } },
        },
        orderBy: [{ lab: { name: "asc" } }, { timeSlot: "asc" }],
      });

    case "teachers":
      return prisma.teacherProfile.findMany({
        where: effectiveCampusId ? { user: userFilter } : {},
        include: {
          user: true,
          _count: { select: { classes: { where: { isActive: true } } } },
        },
        orderBy: { teacherCode: "asc" },
      });

    case "waitlist":
      return prisma.teacherWaitlist.findMany({
        orderBy: { appliedDate: "desc" },
      });

    case "payments":
      return prisma.payment.findMany({
        where: { user: userFilter },
        include: {
          user: true,
          enrollment: { include: { class: { include: { course: true } } } },
        },
        orderBy: { createdAt: "desc" },
      });

    case "remaining":
      return prisma.paymentRemaining.findMany({
        where: { enrollment: classFilter },
        include: {
          enrollment: {
            include: {
              student: { include: { user: true } },
              class: { include: { course: true } },
            },
          },
          partialPayments: true,
        },
        orderBy: { dueDate: "asc" },
      });

    case "certificates":
      return prisma.certificate.findMany({
        where: effectiveCampusId
          ? { course: { campusId: effectiveCampusId } }
          : {},
        include: { student: { include: { user: true } }, course: true },
        orderBy: { issuedAt: "desc" },
      });

    case "coc":
      return prisma.cOCStudent.findMany({
        where: effectiveCampusId ? { campusId: effectiveCampusId } : {},
        include: { studentProfile: { include: { user: true } }, addedBy: true },
        orderBy: { createdAt: "desc" },
      });

    case "requests":
      return prisma.courseRequest.findMany({
        where: effectiveCampusId ? { campusId: effectiveCampusId } : {},
        include: { addedBy: true },
        orderBy: { createdAt: "desc" },
      });

    case "history":
      return prisma.class.findMany({
        where: {
          status: "ENDED",
          ...(effectiveCampusId ? { campusId: effectiveCampusId } : {}),
        },
        include: {
          course: true,
          lab: true,
          teacher: { include: { user: true } },
          _count: { select: { enrollments: true } },
        },
        orderBy: { updatedAt: "desc" },
      });

    case "inventory":
      return prisma.asset.findMany({
        where: effectiveCampusId
          ? { lab: { campusId: effectiveCampusId } }
          : {},
        include: { lab: { include: { campus: true } } },
        orderBy: { name: "asc" },
      });

    default:
      return [];
  }
}
