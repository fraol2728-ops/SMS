"use server";

import { clerkClient } from "@clerk/nextjs/server";
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

type StudentCreationTransaction = {
  user: { create: typeof prisma.user.create };
  payment: { create: typeof prisma.payment.create };
};

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

async function getCurrentAdminCampusId(): Promise<string | null> {
  try {
    const { auth } = await import("@clerk/nextjs/server");
    const { userId } = await auth();
    if (!userId) return null;
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { campusId: true },
    });
    return user?.campusId ?? null;
  } catch {
    return null;
  }
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

    if (!v.email?.trim()) {
      return err(
        "Email is required to send the student their login invitation.",
      );
    }

    const email = v.email.trim().toLowerCase();
    const campusId = await getCurrentAdminCampusId();
    if (!campusId) {
      return err(
        "Could not determine your campus. Please contact super admin.",
      );
    }

    const course = await prisma.course.findFirst({
      where: { id: v.courseId, campusId },
    });
    if (!course) return err("This course does not belong to your campus.");

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return err("A user with this email is already registered.");
    }

    const startDate = v.startDate ? new Date(v.startDate) : new Date();
    const studentCount = await prisma.studentProfile.count();
    const currentYear = new Date().getFullYear();
    const studentCode = `EXC-${currentYear}-${String(studentCount + 1).padStart(3, "0")}`;

    await prisma.$transaction(async (tx: StudentCreationTransaction) => {
      const newUser = await tx.user.create({
        data: {
          clerkId: `pending_${Date.now()}`,
          role: "STUDENT",
          firstName: v.firstName,
          lastName: v.lastName,
          email,
          phone: v.phone,
          gender: v.gender,
          address: v.address,
          campusId,
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
              enrollments: { orderBy: { createdAt: "desc" }, take: 1 },
            },
          },
        },
      });

      const enrollmentId = newUser.studentProfile?.enrollments[0]?.id;
      if (!enrollmentId) throw new Error("Failed to create enrollment");

      await tx.payment.create({
        data: {
          userId: newUser.id,
          enrollmentId,
          amount: v.paymentAmount,
          method: v.paymentMethod,
          status: v.paymentStatus,
          paidAt: v.paymentStatus === "PAID" ? new Date() : undefined,
        },
      });

      return newUser;
    });

    try {
      const clerk = await clerkClient();
      await clerk.invitations.createInvitation({
        emailAddress: email,
        publicMetadata: { role: "STUDENT", campusId },
        redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/student`,
        ignoreExisting: true,
      });
    } catch (clerkError) {
      console.error("Clerk invitation failed:", clerkError);
    }

    revalidatePath("/admin/students");
    revalidatePath("/admin/courses");
    return { success: true as const, studentCode };
  } catch (e) {
    if (e instanceof Error) {
      if (e.message.includes("email") || e.message.includes("unique")) {
        return err("A user with this email already exists.");
      }
      return err(e.message);
    }
    return err("Failed to register student. Please try again.");
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

    const campusId = await getCurrentAdminCampusId();
    if (!campusId) return err("Could not determine your campus.");

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
          campusId,
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
    const normalized = {
      ...raw,
      gender: emptyToUndefined(raw.gender),
      phone: emptyToUndefined(raw.phone),
      specialty: emptyToUndefined(raw.specialty),
      bio: emptyToUndefined(raw.bio),
    };
    const v = teacherSchema.parse(normalized);

    const email = v.email.trim().toLowerCase();
    const campusId = await getCurrentAdminCampusId();
    if (!campusId) {
      return err(
        "Could not determine your campus. Please contact super admin.",
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return err("A user with this email is already registered.");
    }

    const c = await prisma.teacherProfile.count();
    await prisma.user.create({
      data: {
        clerkId: `pending_${Date.now()}`,
        role: "TEACHER",
        firstName: v.firstName,
        lastName: v.lastName,
        email,
        phone: v.phone,
        gender: v.gender,
        campusId,
        teacherProfile: {
          create: {
            teacherCode: `TCH-${String(c + 1).padStart(3, "0")}`,
            specialty: v.specialty,
            bio: v.bio,
          },
        },
      },
    });

    try {
      const clerk = await clerkClient();
      await clerk.invitations.createInvitation({
        emailAddress: email,
        publicMetadata: { role: "TEACHER", campusId },
        redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/teacher`,
        ignoreExisting: true,
      });
    } catch (clerkError) {
      console.error("Clerk invitation failed:", clerkError);
    }

    revalidatePath("/admin/teachers");
    return ok;
  } catch (e) {
    if (e instanceof Error) {
      if (e.message.includes("email") || e.message.includes("unique")) {
        return err("A user with this email already exists.");
      }
      return err(e.message);
    }
    return err("Failed to add teacher. Please try again.");
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
