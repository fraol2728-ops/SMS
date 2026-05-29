"use server";

import { clerkClient } from "@clerk/nextjs/server";
import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  courseSchema,
  scheduleSchema,
  studentSchema,
  teacherSchema,
  updateStudentSchema,
} from "@/lib/validations/admin";

const ok = { success: true as const };
const err = (error: string) => ({ success: false as const, error });

type ActionInput =
  | FormData
  | Record<string, FormDataEntryValue | number | boolean | undefined>;

function actionInputToObject(input: ActionInput) {
  return input instanceof FormData
    ? Object.fromEntries(input.entries())
    : input;
}

function emptyToUndefined(value: unknown) {
  return typeof value === "string" && value.trim() === "" ? undefined : value;
}

function parseBoolean(
  value: FormDataEntryValue | number | boolean | undefined,
  defaultValue?: boolean,
) {
  if (typeof value === "boolean") return value;
  if (value === undefined) return defaultValue;
  return value === "true";
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function generateSlug(title: string): string {
  const suffix = Math.random().toString(36).substring(2, 7);
  return `${slugify(title)}-${suffix}`;
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

export async function createStudent(input: ActionInput) {
  try {
    const raw = actionInputToObject(input);
    const v = studentSchema.parse({
      ...raw,
      email: raw.email ?? "",
      gender: emptyToUndefined(raw.gender),
      paymentMethod: emptyToUndefined(raw.paymentMethod),
      paymentAmount: Number(raw.paymentAmount),
    });

    const startDate = v.startDate ? new Date(v.startDate) : new Date();
    const normalizedPhone = v.phone.trim().replace(/\s+/g, "");
    const email = v.email?.trim()
      ? v.email.trim()
      : `${normalizedPhone}.${Date.now()}@exceed.local`;

    const existingUser = await prisma.user.findFirst({
      where: { email },
    });
    if (existingUser) {
      return err("A student with this email or phone is already registered.");
    }

    const clerk = await clerkClient();
    const clerkUser = await clerk.users.createUser({
      emailAddress: [email],
      publicMetadata: { role: "STUDENT" },
      firstName: v.firstName,
      lastName: v.lastName,
    });

    try {
      const studentCount = await prisma.studentProfile.count();
      const currentYear = new Date().getFullYear();
      const studentCode = `EXC-${currentYear}-${String(studentCount + 1).padStart(3, "0")}`;

      await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const user = await tx.user.create({
          data: {
            clerkId: clerkUser.id,
            role: "STUDENT",
            firstName: v.firstName,
            lastName: v.lastName,
            email,
            phone: v.phone,
            gender: v.gender,
            address: v.address,
            studentProfile: {
              create: {
                studentCode,
                guardianName: v.guardianName,
                guardianPhone: v.guardianPhone,
                emergencyContact: v.emergencyContact,
                notes: v.notes,
                enrollments: {
                  create: {
                    courseId: v.courseId,
                    startDate,
                    status: "ACTIVE",
                    schedule: v.schedule,
                    days: v.days,
                    classType: v.classType,
                  },
                },
              },
            },
          },
          include: {
            studentProfile: {
              include: {
                enrollments: {
                  orderBy: { createdAt: "desc" },
                  take: 1,
                },
              },
            },
          },
        });

        const enrollmentId = user.studentProfile?.enrollments[0]?.id;
        if (!enrollmentId) throw new Error("Failed to create enrollment");

        await tx.payment.create({
          data: {
            userId: user.id,
            enrollmentId,
            amount: v.paymentAmount,
            method: v.paymentMethod,
            status: v.paymentStatus,
            paidAt: v.paymentStatus === "PAID" ? new Date() : undefined,
          },
        });

        return user;
      });

      revalidatePath("/admin/students");
      revalidatePath("/admin/courses");
      return ok;
    } catch (dbError) {
      // Rollback: delete Clerk user if DB transaction fails
      await clerk.users.deleteUser(clerkUser.id);
      throw dbError;
    }
  } catch (e) {
    if (e instanceof Error) {
      if (
        e.message.includes("email") ||
        e.message.includes("Unprocessable") ||
        e.message.includes("duplicate") ||
        e.message.includes("unique")
      ) {
        return err(
          "This email or phone is already registered. Please use a different email or phone number.",
        );
      }
      return err(e.message);
    }
    return err("Failed to create student");
  }
}

export async function updateStudent(id: string, formData: FormData) {
  try {
    const v = updateStudentSchema.parse(actionInputToObject(formData));
    await prisma.user.update({
      where: { id },
      data: {
        firstName: v.firstName,
        lastName: v.lastName,
        email: v.email,
        phone: v.phone,
        gender: v.gender,
        address: v.address,
        studentProfile: {
          update: {
            guardianName: v.guardianName,
            guardianPhone: v.guardianPhone,
            emergencyContact: v.emergencyContact,
            notes: v.notes,
          },
        },
      },
    });
    revalidatePath(`/admin/students/${id}`);
    return ok;
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed");
  }
}

export async function deleteStudent(id: string) {
  try {
    await prisma.enrollment.updateMany({
      where: { student: { userId: id } },
      data: { status: "DROPPED" },
    });
    revalidatePath("/admin/students");
    return ok;
  } catch (_e) {
    return err("Failed");
  }
}

export async function createCourse(input: ActionInput) {
  try {
    const raw = actionInputToObject(input);
    const v = courseSchema.parse({
      title: raw.title,
      fee: Number(raw.fee),
      isActive: parseBoolean(raw.isActive, true),
    });

    const createCourseWithSlug = () =>
      prisma.course.create({
        data: {
          title: v.title,
          fee: v.fee,
          isActive: v.isActive,
          slug: generateSlug(v.title),
          durationWeeks: 8,
          classType: "GROUP",
          description: null,
        },
      });

    try {
      await createCourseWithSlug();
    } catch (e) {
      if (!isUniqueConstraintError(e)) {
        throw e;
      }

      await createCourseWithSlug();
    }

    revalidatePath("/admin/courses");
    revalidatePath("/admin/students/new");
    return ok;
  } catch (e) {
    if (isUniqueConstraintError(e)) {
      return err(
        "A course with this name already exists. Please use a different name.",
      );
    }

    return err(e instanceof Error ? e.message : "Failed");
  }
}

export async function updateCourse(id: string, formData: FormData) {
  try {
    const raw = actionInputToObject(formData);
    const v = courseSchema.partial().parse({
      title: raw.title,
      fee: raw.fee === undefined ? undefined : Number(raw.fee),
      isActive: parseBoolean(raw.isActive),
    });
    await prisma.course.update({
      where: { id },
      data: {
        ...v,
        slug: v.title ? slugify(v.title) : undefined,
      },
    });
    revalidatePath(`/admin/courses/${id}`);
    return ok;
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed");
  }
}

export async function createTeacher(formData: FormData) {
  try {
    const raw = actionInputToObject(formData);

    // Normalize empty strings to undefined
    const normalized = {
      ...raw,
      gender: emptyToUndefined(raw.gender),
      phone: emptyToUndefined(raw.phone),
      specialty: emptyToUndefined(raw.specialty),
      bio: emptyToUndefined(raw.bio),
    };

    const v = teacherSchema.parse(normalized);

    const existingUser = await prisma.user.findFirst({
      where: { email: v.email },
    });
    if (existingUser) {
      return err("A teacher with this email is already registered.");
    }

    const clerk = await clerkClient();
    const cu = await clerk.users.createUser({
      emailAddress: [v.email],
      publicMetadata: { role: "TEACHER" },
      firstName: v.firstName,
      lastName: v.lastName,
    });

    try {
      const c = await prisma.teacherProfile.count();
      await prisma.user.create({
        data: {
          clerkId: cu.id,
          role: "TEACHER",
          firstName: v.firstName,
          lastName: v.lastName,
          email: v.email,
          phone: v.phone,
          gender: v.gender,
          teacherProfile: {
            create: {
              teacherCode: `TCH-${String(c + 1).padStart(3, "0")}`,
              specialty: v.specialty,
              bio: v.bio,
            },
          },
        },
      });
    } catch (dbError) {
      // Rollback: delete Clerk user if DB creation fails
      await clerk.users.deleteUser(cu.id);
      throw dbError;
    }

    revalidatePath("/admin/teachers");
    return ok;
  } catch (e) {
    if (e instanceof Error) {
      if (
        e.message.includes("email") ||
        e.message.includes("Unprocessable") ||
        e.message.includes("duplicate") ||
        e.message.includes("unique")
      ) {
        return err("A teacher with this email already exists in the system.");
      }
      return err(e.message);
    }
    return err("Failed to create teacher");
  }
}

export async function syncClerkUsers() {
  // This action finds Clerk users that don't have a matching DB user
  // and can be called manually to diagnose sync issues
  // For now just return a helpful message
  return {
    success: true,
    message:
      "Use Clerk Dashboard to manually delete orphan users at dashboard.clerk.com",
  };
}

export async function createSchedule(formData: FormData) {
  try {
    const v = scheduleSchema.parse(actionInputToObject(formData));
    await prisma.schedule.create({ data: v });
    revalidatePath("/admin/schedules");
    return ok;
  } catch (_e) {
    return err("Failed");
  }
}
export async function replyToReport(reportId: string, content: string) {
  try {
    if (!content) return err("Content required");
    await prisma.report.update({
      where: { id: reportId },
      data: { replyContent: content, repliedAt: new Date(), status: "REPLIED" },
    });
    revalidatePath(`/admin/reports/${reportId}`);
    return ok;
  } catch (_e) {
    return err("Failed");
  }
}

export async function markReportRead(reportId: string) {
  try {
    const report = await prisma.report.findUnique({ where: { id: reportId } });
    if (report?.status === "UNREAD") {
      await prisma.report.update({
        where: { id: reportId },
        data: { status: "READ" },
      });
    }
    revalidatePath("/admin/reports");
    return { success: true as const };
  } catch (_e) {
    return { success: false as const, error: "Failed" };
  }
}

export async function dropEnrollment(enrollmentId: string) {
  try {
    await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { status: "DROPPED", endDate: new Date() },
    });
    revalidatePath("/admin/students");
    return ok;
  } catch (_e) {
    return err("Failed");
  }
}

export async function toggleCourseStatus(courseId: string, isActive: boolean) {
  try {
    await prisma.course.update({ where: { id: courseId }, data: { isActive } });
    revalidatePath("/admin/courses");
    return ok;
  } catch (_e) {
    return err("Failed");
  }
}
