import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type SearchResult = {
  type: "student" | "teacher" | "class";
  id: string;
  title: string;
  subtitle: string;
  href: string;
};

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ results: [] });
    if (!["ADMIN", "SUPER_ADMIN", "TEACHER"].includes(user.role)) {
      return NextResponse.json({ results: [] });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();
    const campusId = searchParams.get("campusId") || undefined;
    const portal = searchParams.get("portal") ?? "admin";

    if (!q || q.length < 2) return NextResponse.json({ results: [] });

    const results: SearchResult[] = [];

    if (portal === "teacher") {
      const teacher = await prisma.user.findUnique({
        where: { clerkId: user.clerkId },
        include: {
          teacherProfile: {
            include: { classes: { select: { id: true } } },
          },
        },
      });

      const classIds = teacher?.teacherProfile?.classes.map((c) => c.id) ?? [];
      if (classIds.length === 0) return NextResponse.json({ results: [] });

      const teacherStudents = await prisma.studentProfile.findMany({
        where: {
          enrollments: {
            some: {
              classId: { in: classIds },
              status: "ACTIVE",
            },
          },
          OR: [
            { studentCode: { contains: q, mode: "insensitive" } },
            { user: { firstName: { contains: q, mode: "insensitive" } } },
            { user: { lastName: { contains: q, mode: "insensitive" } } },
            { user: { phone: { contains: q } } },
            { user: { email: { contains: q, mode: "insensitive" } } },
          ],
        },
        include: {
          user: true,
          enrollments: {
            where: { status: "ACTIVE" },
            include: { class: { include: { course: true } } },
            take: 1,
          },
        },
        take: 8,
      });

      teacherStudents.forEach((student) => {
        results.push({
          type: "student",
          id: student.userId,
          title: `${student.user.firstName} ${student.user.lastName}`,
          subtitle: `${student.studentCode} • ${student.enrollments[0]?.class?.course?.title ?? "No class"}`,
          href: `/teacher/students/${student.userId}`,
        });
      });

      return NextResponse.json({ results });
    }

    const students = await prisma.studentProfile.findMany({
      where: {
        user: {
          campusId,
          OR: [
            { firstName: { contains: q, mode: "insensitive" } },
            { lastName: { contains: q, mode: "insensitive" } },
            { phone: { contains: q } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        },
      },
      include: {
        user: true,
        enrollments: {
          where: { status: "ACTIVE" },
          include: { class: { include: { course: true } } },
          take: 1,
        },
      },
      take: 5,
    });

    students.forEach((student) => {
      results.push({
        type: "student",
        id: student.userId,
        title: `${student.user.firstName} ${student.user.lastName}`,
        subtitle: `${student.studentCode} • ${student.enrollments[0]?.class?.course?.title ?? "No class"}`,
        href:
          portal === "super-admin"
            ? `/super-admin/students/${student.userId}${campusId ? `?campusId=${campusId}` : ""}`
            : `/admin/students/${student.userId}`,
      });
    });

    const byCode = await prisma.studentProfile.findMany({
      where: {
        studentCode: { contains: q, mode: "insensitive" },
        user: { campusId },
      },
      include: {
        user: true,
        enrollments: {
          where: { status: "ACTIVE" },
          include: { class: { include: { course: true } } },
          take: 1,
        },
      },
      take: 3,
    });

    byCode.forEach((student) => {
      if (results.some((result) => result.id === student.userId)) return;
      results.push({
        type: "student",
        id: student.userId,
        title: `${student.user.firstName} ${student.user.lastName}`,
        subtitle: `${student.studentCode} • ${student.enrollments[0]?.class?.course?.title ?? "No class"}`,
        href:
          portal === "super-admin"
            ? `/super-admin/students/${student.userId}${campusId ? `?campusId=${campusId}` : ""}`
            : `/admin/students/${student.userId}`,
      });
    });

    const teachers = await prisma.user.findMany({
      where: {
        role: "TEACHER",
        campusId,
        OR: [
          { firstName: { contains: q, mode: "insensitive" } },
          { lastName: { contains: q, mode: "insensitive" } },
          { phone: { contains: q } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      },
      include: { teacherProfile: true },
      take: 3,
    });

    teachers.forEach((teacher) => {
      if (portal === "super-admin" && !teacher.teacherProfile?.id) return;
      results.push({
        type: "teacher",
        id: teacher.id,
        title: `${teacher.firstName} ${teacher.lastName}`,
        subtitle: `${teacher.teacherProfile?.teacherCode ?? ""} • ${(
          teacher.teacherProfile?.specialties ?? []
        )
          .slice(0, 2)
          .join(", ")}`,
        href:
          portal === "super-admin"
            ? `/super-admin/teachers/${teacher.teacherProfile?.id}${campusId ? `?campusId=${campusId}` : ""}`
            : `/admin/teachers/${teacher.id}`,
      });
    });

    const classes = await prisma.class.findMany({
      where: {
        campusId,
        isActive: true,
        OR: [
          { course: { title: { contains: q, mode: "insensitive" } } },
          { lab: { name: { contains: q, mode: "insensitive" } } },
        ],
      },
      include: { course: true, lab: true },
      take: 3,
    });

    classes.forEach((classRecord) => {
      results.push({
        type: "class",
        id: classRecord.id,
        title: classRecord.course.title,
        subtitle: `${classRecord.lab?.name ?? "Online"} • ${classRecord.status}`,
        href:
          portal === "super-admin"
            ? `/super-admin/classes/${classRecord.id}${campusId ? `?campusId=${campusId}` : ""}`
            : `/admin/classes/${classRecord.id}`,
      });
    });

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ results: [] });
  }
}
