"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

const ok = { success: true as const };
const err = (error: string) => ({ success: false as const, error });

async function getTeacherProfile() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;
  const user = await prisma.user.findUnique({
    where: { clerkId },
    include: { teacherProfile: true },
  });
  return user?.teacherProfile ?? null;
}

export async function submitAttendance(
  records: {
    enrollmentId: string;
    status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
    classId: string;
    date: string;
  }[],
) {
  try {
    const teacherProfile = await getTeacherProfile();
    if (!teacherProfile) return err("Not authenticated");

    if (records.length === 0) return err("No records to save");

    const classId = records[0].classId;
    const attendanceDate = new Date(records[0].date);

    if (!classId || Number.isNaN(attendanceDate.getTime())) {
      return err("Invalid attendance data");
    }

    const classRecord = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        enrollments: {
          where: { status: "ACTIVE" },
          select: { id: true },
        },
      },
    });

    if (classRecord?.teacherId !== teacherProfile.id) {
      return err("You are not assigned to this class");
    }

    const enrollmentIds = new Set(
      classRecord.enrollments.map((e: any) => e.id),
    );
    const invalidRecord = records.find(
      (record) =>
        record.classId !== classId ||
        record.date !== records[0].date ||
        !enrollmentIds.has(record.enrollmentId),
    );

    if (invalidRecord) {
      return err("Attendance records must belong to your selected class");
    }

    await Promise.all(
      records.map((record) =>
        prisma.attendance.upsert({
          where: {
            enrollmentId_classId_date: {
              enrollmentId: record.enrollmentId,
              classId: record.classId,
              date: attendanceDate,
            },
          },
          create: {
            enrollmentId: record.enrollmentId,
            classId: record.classId,
            date: attendanceDate,
            status: record.status,
          },
          update: {
            status: record.status,
          },
        }),
      ),
    );

    revalidatePath("/teacher/attendance");
    revalidatePath("/teacher");
    return ok;
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed to save attendance");
  }
}

export async function sendReport(formData: FormData) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return err("Not authenticated");

    const sender = await prisma.user.findUnique({
      where: { clerkId },
      include: {
        teacherProfile: {
          include: {
            classes: {
              include: {
                enrollments: {
                  where: { status: "ACTIVE" },
                  include: { student: true },
                },
              },
            },
          },
        },
        campus: true,
      },
    });
    if (!sender?.teacherProfile) return err("User not found");

    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const studentUserId = formData.get("studentId") as string | null;

    if (!title?.trim() || !content?.trim()) {
      return err("Title and content are required");
    }

    let studentProfileId: string | null = null;
    if (studentUserId) {
      const allowedStudent = sender.teacherProfile.classes
        .flatMap((c: any) => c.enrollments)
        .find((enrollment: any) => enrollment.student.userId === studentUserId);

      if (!allowedStudent) {
        return err("You can only report on your own students");
      }

      studentProfileId = allowedStudent.studentId;
    }

    const admins = await prisma.user.findMany({
      where: {
        role: { in: ["ADMIN", "SUPER_ADMIN"] },
        ...(sender.campusId ? { campusId: sender.campusId } : {}),
      },
      select: { id: true },
    });

    if (admins.length === 0) {
      return err("No admin found for your campus");
    }

    await Promise.all(
      admins.map((admin: any) =>
        prisma.report.create({
          data: {
            senderId: sender.id,
            receiverId: admin.id,
            studentId: studentProfileId,
            title: title.trim(),
            content: content.trim(),
            status: "UNREAD",
          },
        }),
      ),
    );

    revalidatePath("/teacher/reports");
    return ok;
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed to send report");
  }
}

export async function addMaterial(formData: FormData) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return err("Not authenticated");

    const teacher = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true, teacherProfile: { select: { id: true } } },
    });
    if (!teacher?.teacherProfile) return err("Teacher not found");

    const classId = formData.get("classId") as string;
    const title = formData.get("title") as string;
    const url = formData.get("url") as string;
    const type = (formData.get("type") as string) || "LINK";
    const description = formData.get("description") as string;

    if (!classId || !title?.trim() || !url?.trim()) {
      return err("Class, title, and URL are required");
    }

    const classRecord = await prisma.class.findUnique({
      where: { id: classId },
      select: { teacherId: true },
    });

    if (classRecord?.teacherId !== teacher.teacherProfile.id) {
      return err("You can only add materials to your own classes");
    }

    await prisma.material.create({
      data: {
        classId,
        uploadedById: teacher.id,
        title: title.trim(),
        url: url.trim(),
        type: type as "LINK" | "PDF" | "VIDEO" | "DOCUMENT" | "OTHER",
        description: description?.trim() || null,
      },
    });

    revalidatePath("/teacher/materials");
    revalidatePath("/student/materials");
    return ok;
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed to add material");
  }
}

export async function deleteMaterial(materialId: string) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return err("Not authenticated");

    const teacher = await prisma.user.findUnique({
      where: { clerkId },
      select: { teacherProfile: { select: { id: true } } },
    });
    if (!teacher?.teacherProfile) return err("Teacher not found");

    const material = await prisma.material.findUnique({
      where: { id: materialId },
      include: { class: { select: { teacherId: true } } },
    });

    if (!material) return err("Material not found");
    if (material.class.teacherId !== teacher.teacherProfile.id) {
      return err("You can only delete materials from your own classes");
    }

    await prisma.material.delete({ where: { id: materialId } });
    revalidatePath("/teacher/materials");
    revalidatePath("/student/materials");
    return ok;
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed to delete material");
  }
}
